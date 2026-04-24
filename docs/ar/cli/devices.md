---
read_when:
    - أنت توافق على طلبات اقتران الأجهزة
    - تحتاج إلى تدوير رموز الأجهزة أو إبطالها
summary: مرجع CLI لـ `openclaw devices` (اقتران الأجهزة + تدوير/إبطال الرموز المميزة)
title: الأجهزة
x-i18n:
    generated_at: "2026-04-24T07:34:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4ae835807ba4b0aea1073b9a84410a10fa0394d7d34e49d645071108cea6a35
    source_path: cli/devices.md
    workflow: 15
---

# `openclaw devices`

إدارة طلبات اقتران الأجهزة والرموز المميزة ذات نطاق الجهاز.

## الأوامر

### `openclaw devices list`

إدراج طلبات الاقتران المعلقة والأجهزة المقترنة.

```
openclaw devices list
openclaw devices list --json
```

يعرض خرج الطلبات المعلقة مستوى الوصول المطلوب بجانب مستوى الوصول
المعتمد الحالي للجهاز عندما يكون الجهاز مقترنًا بالفعل. وهذا يجعل
ترقيات النطاق/الدور واضحة بدلًا من أن تبدو كما لو أن الاقتران قد فُقد.

### `openclaw devices remove <deviceId>`

إزالة إدخال جهاز مقترن واحد.

عندما تكون مصادَقًا باستخدام رمز مميز لجهاز مقترن، يمكن للجهات غير الإدارية
إزالة إدخال **جهازها فقط**. وتتطلب إزالة جهاز آخر
`operator.admin`.

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

مسح الأجهزة المقترنة دفعة واحدة.

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

اعتماد طلب اقتران جهاز معلق باستخدام `requestId` المطابق تمامًا. إذا تم
حذف `requestId` أو تمرير `--latest`، فسيطبع OpenClaw فقط
الطلب المعلق المحدد ثم ينهي التنفيذ؛ أعد تشغيل الاعتماد باستخدام
معرّف الطلب الدقيق بعد التحقق من التفاصيل.

ملاحظة: إذا أعاد جهاز محاولة الاقتران مع تفاصيل مصادقة متغيرة (الدور/النطاقات/المفتاح
العام)، فإن OpenClaw يستبدل الإدخال المعلق السابق ويصدر
`requestId` جديدًا. شغّل `openclaw devices list` مباشرة قبل الاعتماد لاستخدام
المعرّف الحالي.

إذا كان الجهاز مقترنًا بالفعل وطلب نطاقات أوسع أو دورًا أوسع،
فإن OpenClaw يبقي الاعتماد الحالي كما هو وينشئ طلب ترقية
معلقًا جديدًا. راجع عمودَي `Requested` و`Approved` في `openclaw devices list`
أو استخدم `openclaw devices approve --latest` لمعاينة الترقية الدقيقة قبل
اعتمادها.

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

رفض طلب اقتران جهاز معلق.

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

تدوير رمز جهاز مميز لدور محدد (مع تحديث النطاقات اختياريًا).
يجب أن يكون الدور الهدف موجودًا بالفعل في عقد الاقتران المعتمد لذلك الجهاز؛
ولا يمكن لعملية التدوير إنشاء دور جديد غير معتمد.
إذا حذفت `--scope`، فإن عمليات إعادة الاتصال اللاحقة باستخدام الرمز المدور المخزن
تعيد استخدام النطاقات المعتمدة المخبأة لذلك الرمز.
وإذا مررت قيم `--scope` صريحة، فستصبح هذه
مجموعة النطاقات المخزنة لعمليات إعادة الاتصال المستقبلية باستخدام الرمز المخبأ.
يمكن لجهات الاتصال غير الإدارية من الأجهزة المقترنة تدوير **رمز جهازها**
فقط.
كذلك، يجب أن تبقى أي قيم `--scope` صريحة ضمن نطاقات
operator الخاصة بجلسة المتصل نفسه؛ ولا يمكن لعملية التدوير إنشاء رمز operator
أوسع من الذي يملكه المتصل بالفعل.

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

يعيد حمولة الرمز الجديد بصيغة JSON.

### `openclaw devices revoke --device <id> --role <role>`

إبطال رمز جهاز مميز لدور محدد.

يمكن لجهات الاتصال غير الإدارية من الأجهزة المقترنة إبطال **رمز جهازها**
فقط.
ويتطلب إبطال رمز جهاز آخر `operator.admin`.

```
openclaw devices revoke --device <deviceId> --role node
```

يعيد نتيجة الإبطال بصيغة JSON.

## الخيارات الشائعة

- `--url <url>`: عنوان URL لـ Gateway WebSocket (يستخدم `gateway.remote.url` افتراضيًا عند ضبطه).
- `--token <token>`: رمز Gateway المميز (إذا كان مطلوبًا).
- `--password <password>`: كلمة مرور Gateway (مصادقة كلمة المرور).
- `--timeout <ms>`: مهلة RPC.
- `--json`: خرج JSON (مستحسن للبرمجة النصية).

ملاحظة: عند ضبط `--url`، لا يعود CLI إلى بيانات الاعتماد الموجودة في الإعدادات أو البيئة.
مرر `--token` أو `--password` صراحةً. ويُعد غياب بيانات الاعتماد الصريحة خطأً.

## ملاحظات

- يعيد تدوير الرمز رمزًا جديدًا (حساسًا). تعامل معه كأنه سر.
- تتطلب هذه الأوامر النطاق `operator.pairing` (أو `operator.admin`).
- يبقى تدوير الرمز ضمن مجموعة أدوار الاقتران المعتمدة وخط الأساس
  للنطاقات المعتمدة لذلك الجهاز. ولا يمنح إدخال رمز مخبأ شارد
  هدف تدوير جديدًا.
- بالنسبة إلى جلسات رموز الأجهزة المقترنة، تكون الإدارة عبر الأجهزة admin-only:
  تكون `remove` و`rotate` و`revoke` مقتصرة على الجهاز نفسه ما لم يكن لدى
  المتصل `operator.admin`.
- تم تقييد `devices clear` عمدًا بواسطة `--yes`.
- إذا لم يكن نطاق الاقتران متاحًا على local loopback (ولم يتم تمرير `--url` صراحةً)، يمكن لكل من list/approve استخدام fallback اقتران محلي.
- يتطلب `devices approve` معرّف طلب صريحًا قبل إنشاء الرموز؛ ويؤدي حذف `requestId` أو تمرير `--latest` إلى المعاينة فقط لأحدث طلب معلق.

## قائمة التحقق من استعادة انجراف الرمز

استخدم هذا عندما يستمر فشل Control UI أو العملاء الآخرين مع `AUTH_TOKEN_MISMATCH` أو `AUTH_DEVICE_TOKEN_MISMATCH`.

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

4. إذا لم يكن التدوير كافيًا، فأزل الاقتران القديم واعتمد مرة أخرى:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. أعد محاولة اتصال العميل باستخدام الرمز/كلمة المرور المشتركة الحالية.

ملاحظات:

- يكون ترتيب أولوية مصادقة إعادة الاتصال العادية هو: الرمز/كلمة المرور المشتركة الصريحة أولًا، ثم `deviceToken` الصريح، ثم رمز الجهاز المخزن، ثم رمز bootstrap.
- يمكن لاستعادة `AUTH_TOKEN_MISMATCH` الموثوقة أن ترسل مؤقتًا كلًا من الرمز المشترك ورمز الجهاز المخزن معًا لتلك المحاولة الواحدة المحدودة.

ذو صلة:

- [استكشاف أخطاء مصادقة لوحة التحكم وإصلاحها](/ar/web/dashboard#if-you-see-unauthorized-1008)
- [استكشاف أخطاء Gateway وإصلاحها](/ar/gateway/troubleshooting#dashboard-control-ui-connectivity)

## ذو صلة

- [مرجع CLI](/ar/cli)
- [Nodes](/ar/nodes)
