---
read_when:
    - استدعاء الأدوات دون تشغيل دور وكيل كامل
    - بناء عمليات أتمتة تحتاج إلى فرض سياسة الأدوات
summary: استدعاء أداة واحدة مباشرة عبر نقطة نهاية HTTP الخاصة بـ Gateway
title: واجهة API لاستدعاء الأدوات
x-i18n:
    generated_at: "2026-04-24T07:44:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# استدعاء الأدوات (HTTP)

يكشف Gateway الخاص بـ OpenClaw عن نقطة نهاية HTTP بسيطة لاستدعاء أداة واحدة مباشرة. وهي مفعّلة دائمًا وتستخدم مصادقة Gateway بالإضافة إلى سياسة الأدوات. ومثل سطح `/v1/*` المتوافق مع OpenAI، تُعامل مصادقة bearer ذات السر المشترك على أنها وصول مشغّل موثوق للـ gateway بالكامل.

- `POST /tools/invoke`
- المنفذ نفسه الخاص بـ Gateway ‏(تعدد WS + HTTP): ‏`http://<gateway-host>:<port>/tools/invoke`

الحد الأقصى الافتراضي لحجم الحمولة هو 2 MB.

## المصادقة

تستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  `Authorization: Bearer <token-or-password>`
- مصادقة HTTP الموثوقة الحاملة للهوية (`gateway.auth.mode="trusted-proxy"`):
  وجّه الطلب عبر الوكيل المراعي للهوية المضبوط ودعه يحقن
  رؤوس الهوية المطلوبة
- المصادقة المفتوحة على ingress خاص (`gateway.auth.mode="none"`):
  لا حاجة إلى رأس مصادقة

ملاحظات:

- عندما تكون `gateway.auth.mode="token"`، استخدم `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
- عندما تكون `gateway.auth.mode="password"`، استخدم `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
- عندما تكون `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر trusted proxy غير loopback مضبوط؛ ولا تفي الوكلاء
  الموجودة على loopback للمضيف نفسه بهذا الوضع.
- إذا كانت `gateway.auth.rateLimit` مضبوطة وحدث عدد كبير جدًا من إخفاقات المصادقة، تعيد نقطة النهاية `429` مع `Retry-After`.

## الحد الأمني (مهم)

تعامل مع نقطة النهاية هذه على أنها سطح **وصول كامل للمشغّل** إلى مثيل gateway.

- مصادقة bearer عبر HTTP هنا ليست نموذج نطاق ضيقًا لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway الصالحة لهذه النقطة النهاية على أنها بيانات اعتماد مالك/مشغّل.
- بالنسبة إلى أوضاع المصادقة ذات السر المشترك (`token` و`password`)، تستعيد نقطة النهاية القيم الافتراضية الكاملة للمشغّل حتى إذا أرسل المستدعي رأس `x-openclaw-scopes` أضيق.
- تعالج مصادقة السر المشترك أيضًا استدعاءات الأدوات المباشرة على هذه النقطة النهاية على أنها أدوار مرسل مالك.
- تحترم أوضاع HTTP الموثوقة الحاملة للهوية (على سبيل المثال مصادقة trusted proxy أو `gateway.auth.mode="none"` على ingress خاص) قيمة `x-openclaw-scopes` عند وجودها، وإلا تعود إلى مجموعة النطاقات الافتراضية العادية للمشغّل.
- احتفظ بهذه النقطة النهاية على loopback/tailnet/ingress خاص فقط؛ ولا تكشفها مباشرة للإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر مشغّل gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    `operator.admin` و`operator.approvals` و`operator.pairing`،
    و`operator.read` و`operator.talk.secrets` و`operator.write`
  - يعامل استدعاءات الأدوات المباشرة على هذه النقطة النهاية على أنها أدوار مرسل مالك
- أوضاع HTTP الموثوقة الحاملة للهوية (على سبيل المثال مصادقة trusted proxy، أو `gateway.auth.mode="none"` على ingress خاص)
  - تصادق هوية خارجية موثوقة أو حد نشر موثوقًا
  - تحترم `x-openclaw-scopes` عندما يكون الرأس موجودًا
  - تعود إلى مجموعة نطاقات المشغّل الافتراضية العادية عندما يكون الرأس غائبًا
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

- `tool` (سلسلة نصية، مطلوب): اسم الأداة المطلوب استدعاؤها.
- `action` (سلسلة نصية، اختياري): يتم ربطه إلى args إذا كان مخطط الأداة يدعم `action` وكانت حمولة args قد حذفته.
- `args` (كائن، اختياري): الوسيطات الخاصة بالأداة.
- `sessionKey` (سلسلة نصية، اختياري): مفتاح الجلسة المستهدفة. إذا حُذف أو كان `"main"`، يستخدم Gateway مفتاح الجلسة الرئيسية المضبوط (مع احترام `session.mainKey` والوكيل الافتراضي، أو `global` في النطاق العام).
- `dryRun` (منطقي، اختياري): محجوز للاستخدام المستقبلي؛ ويتم تجاهله حاليًا.

## سلوك السياسة + التوجيه

تُصفّى إتاحة الأدوات عبر سلسلة السياسة نفسها المستخدمة بواسطة وكلاء Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- سياسات المجموعات (إذا كان مفتاح الجلسة يرتبط بمجموعة أو قناة)
- سياسة الوكيل الفرعي (عند الاستدعاء باستخدام مفتاح جلسة وكيل فرعي)

إذا كانت الأداة غير مسموح بها وفق السياسة، تعيد نقطة النهاية **404**.

ملاحظات مهمة حول الحدود:

- موافقات Exec هي حواجز حماية للمشغّل، وليست حد تفويض منفصلًا لنقطة نهاية HTTP هذه. فإذا كانت الأداة قابلة للوصول هنا عبر مصادقة Gateway + سياسة الأدوات، فإن `/tools/invoke` لا يضيف مطالبة موافقة إضافية لكل استدعاء.
- لا تشارك بيانات اعتماد bearer الخاصة بـ Gateway مع مستدعين غير موثوقين. وإذا كنت تحتاج إلى فصل عبر حدود الثقة، فشغّل gateways منفصلة (ويُفضّل أيضًا مستخدمو نظام تشغيل/مضيفون منفصلون).

كما يطبّق Gateway HTTP قائمة منع صارمة افتراضيًا (حتى إذا سمحت سياسة الجلسة بالأداة):

- `exec` — تنفيذ أوامر مباشر (سطح RCE)
- `spawn` — إنشاء عمليات فرعية عشوائية (سطح RCE)
- `shell` — تنفيذ أوامر shell ‏(سطح RCE)
- `fs_write` — تعديل ملفات عشوائي على المضيف
- `fs_delete` — حذف ملفات عشوائي على المضيف
- `fs_move` — نقل/إعادة تسمية ملفات عشوائي على المضيف
- `apply_patch` — قد تعيد عملية تطبيق patch كتابة ملفات عشوائية
- `sessions_spawn` — طبقة تنسيق الجلسات؛ وإنشاء وكلاء عن بُعد هو RCE
- `sessions_send` — حقن رسائل عبر الجلسات
- `cron` — طبقة التحكم في الأتمتة الدائمة
- `gateway` — طبقة تحكم gateway؛ وتمنع إعادة التهيئة عبر HTTP
- `nodes` — يمكن لتمرير أوامر node الوصول إلى `system.run` على المضيفين المقترنين
- `whatsapp_login` — إعداد تفاعلي يتطلب مسح QR عبر الطرفية؛ ويتعطل على HTTP

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

ولمساعدة سياسات المجموعات على حل السياق، يمكنك اختياريًا ضبط:

- `x-openclaw-message-channel: <channel>` (مثال: `slack` أو `telegram`)
- `x-openclaw-account-id: <accountId>` (عند وجود عدة حسابات)

## الاستجابات

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (طلب غير صالح أو خطأ في مدخلات الأداة)
- `401` → غير مصرّح
- `429` → تم تطبيق حد معدل المصادقة (`Retry-After` مضبوط)
- `404` → الأداة غير متاحة (غير موجودة أو غير مدرجة في قائمة السماح)
- `405` → طريقة غير مسموح بها
- `500` → `{ ok: false, error: { type, message } }` (خطأ غير متوقع في تنفيذ الأداة؛ رسالة منقّاة)

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
