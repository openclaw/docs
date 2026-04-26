---
read_when:
    - أنت توافق على طلبات إقران الأجهزة
    - تحتاج إلى تدوير رموز الأجهزة المميزة أو إبطالها
summary: مرجع CLI لـ `openclaw devices` (إقران الجهاز + تدوير/إبطال الرمز المميز)
title: الأجهزة
x-i18n:
    generated_at: "2026-04-26T11:26:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5746de715f9c1a46b5d0845918c1512723cfed22b711711b8c6dc6e98880f480
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

إدارة طلبات إقران الأجهزة والرموز المميزة الخاصة بنطاق الجهاز.

## الأوامر

### `openclaw devices list`

عرض طلبات الإقران المعلقة والأجهزة المقترنة.

```
openclaw devices list
openclaw devices list --json
```

يعرض خرج الطلبات المعلقة الوصول المطلوب بجانب الوصول الحالي المعتمد للجهاز
عندما يكون الجهاز مقترنًا بالفعل. وهذا يجعل ترقيات النطاق/الدور واضحة
بدلًا من أن تبدو كما لو أن الإقران قد فُقد.

### `openclaw devices remove <deviceId>`

إزالة إدخال جهاز مقترن واحد.

عندما تكون مصادقًا باستخدام رمز جهاز مقترن، يمكن للجهات غير الإدارية
إزالة إدخال **جهازها فقط**. وتتطلب إزالة جهاز آخر
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

مسح الأجهزة المقترنة بشكل مجمّع.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

اعتماد طلب إقران جهاز معلق باستخدام `requestId` مطابق تمامًا. إذا تم حذف `requestId`
أو تم تمرير `--latest`، فلن يفعل OpenClaw سوى طباعة الطلب المعلق المحدد
ثم الخروج؛ أعد تشغيل الاعتماد باستخدام معرّف الطلب المطابق بعد التحقق
من التفاصيل.

ملاحظة: إذا أعاد جهاز محاولة الإقران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح
العام)، فإن OpenClaw يستبدل الإدخال المعلق السابق ويصدر
`requestId` جديدًا. شغّل `openclaw devices list` مباشرة قبل الاعتماد لاستخدام
المعرّف الحالي.

إذا كان الجهاز مقترنًا بالفعل وطلب نطاقات أوسع أو دورًا أوسع،
فإن OpenClaw يُبقي الاعتماد الحالي كما هو وينشئ طلب ترقية معلقًا
جديدًا. راجع عمودي `Requested` و`Approved` في `openclaw devices list`
أو استخدم `openclaw devices approve --latest` لمعاينة الترقية الدقيقة قبل
اعتمادها.

إذا كان Gateway مضبوطًا صراحة باستخدام
`gateway.nodes.pairing.autoApproveCidrs`، فيمكن اعتماد طلبات `role: node` الأولى من
عناوين IP المطابقة للعميل قبل أن تظهر في هذه القائمة. تكون هذه السياسة
معطلة افتراضيًا ولا تنطبق مطلقًا على عملاء operator/browser أو طلبات الترقية.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

رفض طلب إقران جهاز معلق.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

تدوير رمز جهاز لدور محدد (مع تحديث النطاقات اختياريًا).
يجب أن يكون الدور المستهدف موجودًا بالفعل في عقد الإقران المعتمد لذلك الجهاز؛
ولا يمكن لعملية التدوير إنشاء دور جديد غير معتمد.
إذا حذفت `--scope`، فإن عمليات إعادة الاتصال اللاحقة باستخدام الرمز المدور المخزن
تعيد استخدام النطاقات المعتمدة المخزنة مؤقتًا لذلك الرمز.
إذا مررت قيم `--scope` صريحة، فستصبح تلك
هي مجموعة النطاقات المخزنة لعمليات إعادة الاتصال المستقبلية باستخدام الرمز المخزن مؤقتًا.
يمكن للجهات غير الإدارية التي تستخدم رموز الأجهزة المقترنة تدوير **رمز جهازها**
فقط.
ويجب أن تبقى مجموعة نطاقات الرمز المستهدف ضمن نطاقات operator الخاصة بجلسة المستدعي؛
ولا يمكن للتدوير إنشاء أو الحفاظ على رمز operator أوسع من
الذي يملكه المستدعي بالفعل.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

يعيد حمولة الرمز الجديد بصيغة JSON.

### `openclaw devices revoke --device <id> --role <role>`

إبطال رمز جهاز لدور محدد.

يمكن للجهات غير الإدارية التي تستخدم رموز الأجهزة المقترنة إبطال **رمز جهازها**
فقط.
ويتطلب إبطال رمز جهاز آخر `operator.admin`.
ويجب أن تتوافق مجموعة نطاقات الرمز المستهدف أيضًا مع نطاقات operator الخاصة بجلسة المستدعي؛
ولا يمكن للمستدعين الذين يملكون pairing فقط إبطال رموز operator الإدارية/القابلة للكتابة.

```
openclaw devices revoke --device <deviceId> --role node
```

يعيد نتيجة الإبطال بصيغة JSON.

## الخيارات الشائعة

- `--url <url>`: عنوان URL لـ Gateway WebSocket (يستخدم `gateway.remote.url` افتراضيًا عند ضبطه).
- `--token <token>`: رمز Gateway (إذا كان مطلوبًا).
- `--password <password>`: كلمة مرور Gateway (مصادقة كلمة المرور).
- `--timeout <ms>`: مهلة RPC.
- `--json`: خرج JSON (موصى به للبرمجة النصية).

ملاحظة: عند تعيين `--url`، لا يعود CLI إلى بيانات الاعتماد الموجودة في الإعدادات أو البيئة.
مرّر `--token` أو `--password` صراحةً. ويُعد غياب بيانات اعتماد صريحة خطأً.

## ملاحظات

- تعيد عملية تدوير الرمز رمزًا جديدًا (حساسًا). تعامل معه كسر.
- تتطلب هذه الأوامر نطاق `operator.pairing` (أو `operator.admin`).
- `gateway.nodes.pairing.autoApproveCidrs` هي سياسة Gateway اختيارية
  لإقران أجهزة Node الجديدة فقط؛ وهي لا تغير صلاحية اعتماد CLI.
- يظل تدوير الرمز وإبطاله ضمن مجموعة أدوار الإقران المعتمدة
  وخط الأساس المعتمد للنطاقات لذلك الجهاز. ولا يمنح إدخال رمز مخزن مؤقتًا
  بالخطأ هدفًا لإدارة الرموز.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون الإدارة عبر الأجهزة إدارية فقط:
  `remove` و`rotate` و`revoke` تكون ذاتية فقط ما لم يكن لدى المستدعي
  `operator.admin`.
- يكون تعديل الرمز أيضًا محصورًا بنطاقات المستدعي: فلا يمكن لجلسة pairing فقط
  تدوير أو إبطال رمز يحمل حاليًا `operator.admin` أو
  `operator.write`.
- تم تقييد `devices clear` عمدًا بواسطة `--yes`.
- إذا كان نطاق الإقران غير متاح على local loopback (ولم يتم تمرير `--url` صراحةً)، يمكن لـ list/approve استخدام آلية pairing احتياطية محلية.
- يتطلب `devices approve` معرّف طلب صريحًا قبل إنشاء الرموز؛ حذف `requestId` أو تمرير `--latest` يقتصر على معاينة أحدث طلب معلق فقط.

## قائمة التحقق من استعادة انجراف الرمز

استخدم هذا عندما يستمر فشل Control UI أو غيره من العملاء مع `AUTH_TOKEN_MISMATCH` أو `AUTH_DEVICE_TOKEN_MISMATCH`.

1. أكّد مصدر رمز Gateway الحالي:

```bash
openclaw config get gateway.auth.token
```

2. اعرض الأجهزة المقترنة وحدد معرّف الجهاز المتأثر:

```bash
openclaw devices list
```

3. دوّر رمز operator للجهاز المتأثر:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. إذا لم يكن التدوير كافيًا، فأزل pairing القديم واعتمد مرة أخرى:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. أعد محاولة اتصال العميل باستخدام الرمز/كلمة المرور المشتركة الحالية.

ملاحظات:

- ترتيب أولوية مصادقة إعادة الاتصال العادي هو الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
- يمكن لاستعادة `AUTH_TOKEN_MISMATCH` الموثوقة إرسال كل من الرمز المشترك ورمز الجهاز المخزن معًا مؤقتًا من أجل إعادة المحاولة الواحدة المحدودة.

ذو صلة:

- [استكشاف أخطاء مصادقة Dashboard وإصلاحها](/ar/web/dashboard#if-you-see-unauthorized-1008)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#dashboard-control-ui-connectivity)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Nodes](/ar/nodes)
