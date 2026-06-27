---
read_when:
    - بناء أدوات المضيف التي لا يمكنها استخدام عميل RPC عبر WebSocket الخاص بـ Gateway
    - كشف أتمتة إدارة Gateway خلف مدخل خاص موثوق
    - تدقيق نموذج الأمان للوصول عبر HTTP إلى أساليب Gateway
summary: إتاحة طرق محددة من مستوى تحكم Gateway عبر Plugin admin-http-rpc المضمّن والاختياري
title: Plugin RPC عبر HTTP للإدارة
x-i18n:
    generated_at: "2026-06-27T18:00:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f701ef6be7457cd518ecb80b7ec5dade61bb057d62f4ca90984a4c1aa8fdf700
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

يعرض Plugin المضمّن `admin-http-rpc` طرقًا مختارة من مستوى تحكم Gateway عبر HTTP لأتمتة المضيفات الموثوقة التي لا يمكنها استخدام عميل Gateway WebSocket RPC العادي.

يأتي هذا Plugin مضمنًا مع OpenClaw، لكنه معطّل افتراضيًا. عند تعطيله، لا يُسجَّل المسار. عند تفعيله، يضيف:

- `POST /api/v1/admin/rpc`
- نفس المستمع مثل Gateway: `http://<gateway-host>:<port>/api/v1/admin/rpc`

فعّله فقط لأدوات المضيف الخاصة، أو أتمتة شبكة tailnet، أو مدخل داخلي موثوق. لا تعرض هذا المسار مباشرةً للإنترنت العام.

## قبل تفعيله

Admin HTTP RPC هو سطح كامل لمستوى تحكم المشغّل. يمكن لأي مستدعٍ يجتاز مصادقة Gateway عبر HTTP استدعاء الطرق المدرجة في قائمة السماح في هذه الصفحة.

استخدمه عندما تكون كل الشروط التالية صحيحة:

- المستدعي موثوق لتشغيل Gateway.
- المستدعي لا يمكنه استخدام عميل WebSocket RPC.
- المسار قابل للوصول فقط عبر loopback، أو شبكة tailnet، أو مدخل خاص موثّق.
- راجعت الطرق المسموح بها وهي تطابق الأتمتة التي تخطط لتشغيلها.

استخدم مسار WebSocket RPC لعملاء OpenClaw والأدوات التفاعلية التي يمكنها إبقاء اتصال Gateway WebSocket مفتوحًا.

## التفعيل

فعّل Plugin المضمّن:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="التكوين">
    ```json5
    {
      plugins: {
        entries: {
          "admin-http-rpc": { enabled: true },
        },
      },
    }
    ```
  </Tab>
</Tabs>

يُسجَّل المسار أثناء بدء تشغيل Plugin. أعد تشغيل Gateway بعد تغيير تكوين Plugin.

عطّله عندما لا تعود بحاجة إلى سطح HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## التحقق من المسار

استخدم `health` كأصغر طلب آمن:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

تحتوي الاستجابة الناجحة على `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

عند تعطيل Plugin، يعيد المسار `404` لأنه غير مسجّل.

## المصادقة

يستخدم مسار Plugin مصادقة Gateway عبر HTTP.

مسارات المصادقة الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`): `Authorization: Bearer <token-or-password>`
- مصادقة HTTP موثوقة حاملة للهوية (`gateway.auth.mode="trusted-proxy"`): مرّر المسار عبر الوكيل المكوّن والواعي بالهوية ودعه يحقن ترويسات الهوية المطلوبة
- مصادقة مفتوحة عبر مدخل خاص (`gateway.auth.mode="none"`): لا يلزم ترويسة مصادقة

## نموذج الأمان

تعامل مع هذا Plugin كسطح كامل لمشغّل Gateway.

- يتيح تفعيل Plugin عمدًا الوصول إلى طرق admin RPC المدرجة في قائمة السماح عند `/api/v1/admin/rpc`.
- يعلن Plugin عقد البيان المحجوز `contracts.gatewayMethodDispatch: ["authenticated-request"]` حتى يتمكن مسار HTTP المصادق عليه من Gateway من إرسال طرق مستوى التحكم داخل العملية.
- تثبت مصادقة الحامل بالسر المشترك امتلاك سر مشغّل gateway.
- بالنسبة إلى مصادقة `token` و`password`، تُتجاهل ترويسات `x-openclaw-scopes` الأضيق وتُستعاد الإعدادات الافتراضية الكاملة العادية للمشغّل.
- تحترم أوضاع HTTP الموثوقة الحاملة للهوية `x-openclaw-scopes` عند وجودها.
- يعني `gateway.auth.mode="none"` أن هذا المسار غير موثّق إذا كان Plugin مفعّلًا. استخدم ذلك فقط خلف مدخل خاص تثق به بالكامل.
- تُرسَل الطلبات عبر معالجات طرق Gateway نفسها وفحوصات النطاق نفسها مثل WebSocket RPC بعد اجتياز مصادقة مسار Plugin.
- أبقِ هذا المسار على loopback، أو شبكة tailnet، أو مدخل خاص موثوق. لا تعرضه مباشرةً للإنترنت العام.
- عقود بيان Plugin ليست صندوقًا رمليًا. فهي تمنع الاستخدام العرضي لمساعدات SDK المحجوزة؛ ولا تزال Plugins الموثوقة تعمل داخل عملية Gateway.

استخدم بوابات منفصلة عندما يعبر المستدعون حدود الثقة.

## الطلب

```http
POST /api/v1/admin/rpc
Authorization: Bearer <gateway-token>
Content-Type: application/json
```

```json
{
  "id": "optional-request-id",
  "method": "health",
  "params": {}
}
```

الحقول:

- `id` (سلسلة، اختياري): يُنسخ إلى الاستجابة. يُنشأ UUID عند حذفه.
- `method` (سلسلة، مطلوب): اسم طريقة Gateway المسموح بها.
- `params` (أي نوع، اختياري): معاملات خاصة بالطريقة.

الحجم الأقصى الافتراضي لجسم الطلب هو 1 MB.

## الاستجابة

تستخدم استجابات النجاح شكل Gateway RPC:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

تستخدم أخطاء طرق Gateway:

```json
{
  "id": "optional-request-id",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "bad params"
  }
}
```

تتبع حالة HTTP خطأ Gateway عندما يكون ذلك ممكنًا. على سبيل المثال، يعيد `INVALID_REQUEST` الحالة `400`، ويعيد `UNAVAILABLE` الحالة `503`.

## الطرق المسموح بها

- الاكتشاف: `commands.list`
  يعيد أسماء طرق HTTP RPC المسموح بها بواسطة هذا Plugin.
- البوابة: `health`, `status`, `logs.tail`, `usage.status`, `usage.cost`, `gateway.restart.request`
- التكوين: `config.get`, `config.schema`, `config.schema.lookup`, `config.set`, `config.patch`, `config.apply`
- القنوات: `channels.status`, `channels.start`, `channels.stop`, `channels.logout`
- الويب: `web.login.start`, `web.login.wait`
- النماذج: `models.list`, `models.authStatus`
- الوكلاء: `agents.list`, `agents.create`, `agents.update`, `agents.delete`
- الموافقات: `exec.approvals.get`, `exec.approvals.set`, `exec.approvals.node.get`, `exec.approvals.node.set`
- Cron: `cron.status`, `cron.list`, `cron.get`, `cron.runs`, `cron.add`, `cron.update`, `cron.remove`, `cron.run`
- الأجهزة: `device.pair.list`, `device.pair.approve`, `device.pair.reject`, `device.pair.remove`
- العقد: `node.list`, `node.describe`, `node.pair.list`, `node.pair.approve`, `node.pair.reject`, `node.pair.remove`, `node.rename`
- المهام: `tasks.list`, `tasks.get`, `tasks.cancel`
- التشخيصات: `doctor.memory.status`, `update.status`

تُحظر طرق Gateway الأخرى إلى أن تُضاف عمدًا.

## مقارنة WebSocket

يبقى مسار Gateway WebSocket RPC العادي واجهة API المفضلة لمستوى التحكم لعملاء OpenClaw. استخدم Admin HTTP RPC فقط لأدوات المضيف التي تحتاج إلى سطح HTTP بنمط طلب/استجابة.

لا يمكن لعملاء WebSocket ذوي الرمز المشترك من دون هوية جهاز موثوقة إعلان نطاقات المسؤول ذاتيًا أثناء الاتصال. يتبع Admin HTTP RPC عمدًا نموذج مشغّل HTTP الموثوق الحالي: عند تفعيل Plugin، تُعامل مصادقة الحامل بالسر المشترك كصلاحية وصول كاملة للمشغّل لهذا السطح الإداري.

## استكشاف الأخطاء وإصلاحها

`404 Not Found`

: Plugin معطّل، أو لم يُعد تشغيل Gateway منذ تفعيله، أو أن الطلب يُرسل إلى عملية Gateway مختلفة.

`401 Unauthorized`

: لم يستوفِ الطلب مصادقة Gateway عبر HTTP. تحقق من رمز الحامل أو ترويسات هوية trusted-proxy.

`400 INVALID_REQUEST`

: جسم الطلب ليس JSON صالحًا، أو حقل `method` مفقود، أو الطريقة غير موجودة في قائمة السماح الخاصة بـ Plugin.

`503 UNAVAILABLE`

: معالج طريقة Gateway غير متاح. تحقق من سجلات Gateway وأعد المحاولة بعد انتهاء Gateway من بدء التشغيل.

## ذات صلة

- [نطاقات المشغّل](/ar/gateway/operator-scopes)
- [أمان Gateway](/ar/gateway/security)
- [الوصول عن بُعد](/ar/gateway/remote)
- [بيان Plugin](/ar/plugins/manifest#contracts)
- [المسارات الفرعية لـ SDK](/ar/plugins/sdk-subpaths)
