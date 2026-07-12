---
read_when:
    - إنشاء أدوات للمضيف لا يمكنها استخدام عميل RPC عبر WebSocket الخاص بـ Gateway
    - إتاحة أتمتة إدارة Gateway خلف نقطة دخول خاصة وموثوقة
    - تدقيق نموذج الأمان للوصول عبر HTTP إلى أساليب Gateway
summary: إتاحة أساليب مختارة من مستوى تحكم Gateway عبر Plugin ‏admin-http-rpc المضمّن والاختياري تفعيله
title: Plugin لاستدعاء الإجراءات البعيدة الإدارية عبر HTTP
x-i18n:
    generated_at: "2026-07-12T06:11:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0709081efd0ce65cef7edac54df9a71978cbad17e2b25df83ac9075de938376c
    source_path: plugins/admin-http-rpc.md
    workflow: 16
---

تعرض إضافة `admin-http-rpc` المضمّنة مجموعة مسموحًا بها من أساليب مستوى تحكم Gateway عبر HTTP، لأتمتة المضيف الموثوقة التي لا يمكنها إبقاء اتصال Gateway عبر WebSocket مفتوحًا.

تأتي هذه الإضافة مع OpenClaw، لكنها معطّلة افتراضيًا؛ وعندما تكون معطّلة، لا يُسجَّل المسار. وعند تمكينها، تضيف `POST /api/v1/admin/rpc` إلى المستمع نفسه الخاص بـ Gateway (`http://<gateway-host>:<port>/api/v1/admin/rpc`).

مكّنها فقط لأدوات المضيف الخاصة، أو أتمتة الشبكة الطرفية، أو نقطة دخول داخلية موثوقة. لا تكشف هذا المسار مباشرةً للإنترنت العام مطلقًا.

## قبل تمكينها

يُعد Admin HTTP RPC سطحًا كاملًا لمستوى تحكم المشغّل: يمكن لأي مستدعٍ يجتاز مصادقة HTTP الخاصة بـ Gateway استدعاء الأساليب المسموح بها أدناه. مكّنه فقط عند تحقق جميع الشروط التالية:

- المستدعي موثوق لتشغيل Gateway.
- لا يستطيع المستدعي استخدام عميل RPC عبر WebSocket.
- لا يمكن الوصول إلى المسار إلا عبر local loopback، أو شبكة طرفية، أو نقطة دخول خاصة خاضعة للمصادقة.
- راجعت الأساليب المسموح بها، وهي تطابق الأتمتة التي تخطط لتشغيلها.

بالنسبة إلى عملاء OpenClaw والأدوات التفاعلية التي يمكنها إبقاء اتصال Gateway عبر WebSocket مفتوحًا، استخدم RPC عبر WebSocket بدلًا من ذلك.

## التمكين

مكّن Plugin المضمّنة:

<Tabs>
  <Tab title="CLI">
    ```bash
    openclaw plugins enable admin-http-rpc
    openclaw gateway restart
    ```
  </Tab>
  <Tab title="الإعداد">
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

يُسجَّل المسار أثناء بدء تشغيل Plugin، لذا أعد تشغيل Gateway بعد تغيير إعداد Plugin.

عطّلها عندما لا تعود بحاجة إلى سطح HTTP:

```bash
openclaw plugins disable admin-http-rpc
openclaw gateway restart
```

## التحقق من المسار

استخدم `health` بوصفه أصغر طلب آمن:

```bash
curl -sS http://<gateway-host>:<port>/api/v1/admin/rpc \
  -H 'Authorization: Bearer <gateway-token>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"health","params":{}}'
```

تتضمن الاستجابة الناجحة `ok: true`:

```json
{
  "id": "generated-request-id",
  "ok": true,
  "payload": {
    "status": "ok"
  }
}
```

عندما تكون Plugin معطّلة، يعيد المسار `404` لأنه غير مسجّل.

## المصادقة

يستخدم مسار Plugin مصادقة HTTP الخاصة بـ Gateway.

مسارات المصادقة الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):‏ `Authorization: Bearer <token-or-password>`
- مصادقة HTTP الموثوقة الحاملة للهوية (`gateway.auth.mode="trusted-proxy"`): مرّر الطلب عبر الوكيل المُعدّ والمدرك للهوية، ودعه يحقن ترويسات الهوية المطلوبة
- المصادقة المفتوحة عبر نقطة دخول خاصة (`gateway.auth.mode="none"`): لا يلزم ترويسة مصادقة

## نموذج الأمان

تعامل مع هذه Plugin بوصفها سطحًا كاملًا لمشغّل Gateway.

- يتيح تمكين Plugin عمدًا الوصول إلى أساليب RPC الإدارية المسموح بها عند `/api/v1/admin/rpc`.
- تعلن Plugin عقد البيان المحجوز `contracts.gatewayMethodDispatch: ["authenticated-request"]`، وهو ما يتيح لمسار HTTP الخاضع لمصادقة Gateway إرسال أساليب مستوى التحكم داخل العملية. هذه ليست بيئة معزولة: يمنع العقد الاستخدام العرضي لأدوات SDK المساعدة المحجوزة، لكن الإضافات الموثوقة تظل تعمل داخل عملية Gateway.
- تثبت مصادقة حامل السر المشترك (وضعا `token` و`password`) حيازة سر مشغّل Gateway؛ وتُتجاهل ترويسات `x-openclaw-scopes` الأضيق في هذا المسار، وتُستعاد الإعدادات الافتراضية الكاملة المعتادة للمشغّل.
- تحترم مصادقة HTTP الموثوقة الحاملة للهوية (وضع `trusted-proxy`) ترويسة `x-openclaw-scopes` عند وجودها.
- يعني `gateway.auth.mode="none"` أن هذا المسار لا يخضع للمصادقة إذا كانت Plugin ممكّنة. استخدم ذلك فقط خلف نقطة دخول خاصة تثق بها ثقة كاملة.
- تُرسل الطلبات عبر معالجات أساليب Gateway وفحوص النطاق نفسها المستخدمة في RPC عبر WebSocket، بعد اجتياز مصادقة مسار Plugin.
- يظل المسار قابلًا للوصول أثناء مدة تعليق مُحضّرة. ويظل التحقق المحدود من الطلب واستجابة الاكتشاف المحلية `commands.list` متاحين. ومن بين الأساليب المُرسلة إلى Gateway، لا يجوز أثناء إغلاق القبول تشغيل سوى `gateway.suspend.prepare` و`gateway.suspend.status` و`gateway.suspend.resume`؛ أما الأساليب الأخرى المسموح بها فتعيد استجابة Gateway العادية القابلة لإعادة المحاولة `UNAVAILABLE`.
- أبقِ هذا المسار على local loopback، أو شبكة طرفية، أو نقطة دخول خاصة موثوقة. لا تكشفه مباشرةً للإنترنت العام. استخدم بوابات منفصلة عندما يعبر المستدعون حدود الثقة.

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

- `id` (سلسلة نصية، اختياري): يُنسخ إلى الاستجابة. يُنشأ UUID عند حذفه.
- `method` (سلسلة نصية، مطلوب): اسم أسلوب Gateway المسموح به.
- `params` (أي نوع، اختياري): معاملات خاصة بالأسلوب.

الحجم الأقصى الافتراضي لمتن الطلب هو 1 ميغابايت.

## الاستجابة

تستخدم الاستجابات الناجحة بنية RPC الخاصة بـ Gateway:

```json
{
  "id": "optional-request-id",
  "ok": true,
  "payload": {}
}
```

تستخدم أخطاء أساليب Gateway البنية التالية:

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

تتبع حالة HTTP رمز الخطأ:

| رمز الخطأ                  | حالة HTTP |
| -------------------------- | --------- |
| `INVALID_REQUEST`          | 400       |
| `APPROVAL_NOT_FOUND`       | 404       |
| `NOT_LINKED`, `NOT_PAIRED` | 409       |
| `UNAVAILABLE`              | 503       |
| `AGENT_TIMEOUT`            | 504       |
| أي رمز آخر                 | 500       |

## الأساليب المسموح بها

- الاكتشاف: `commands.list`
  يعيد أسماء أساليب HTTP RPC التي تسمح بها هذه Plugin.
- Gateway:‏ `health`، و`status`، و`logs.tail`، و`usage.status`، و`usage.cost`، و`gateway.restart.request`، و`gateway.suspend.prepare`، و`gateway.suspend.status`، و`gateway.suspend.resume`
- الإعداد: `config.get`، و`config.schema`، و`config.schema.lookup`، و`config.set`، و`config.patch`، و`config.apply`
- القنوات: `channels.status`، و`channels.start`، و`channels.stop`، و`channels.logout`
- الويب: `web.login.start`، و`web.login.wait`
- النماذج: `models.list`، و`models.authStatus`
- الوكلاء: `agents.list`، و`agents.create`، و`agents.update`، و`agents.delete`
- الموافقات: `exec.approvals.get`، و`exec.approvals.set`، و`exec.approvals.node.get`، و`exec.approvals.node.set`
- Cron:‏ `cron.status`، و`cron.list`، و`cron.get`، و`cron.runs`، و`cron.add`، و`cron.update`، و`cron.remove`، و`cron.run`
- الأجهزة: `device.pair.list`، و`device.pair.approve`، و`device.pair.reject`، و`device.pair.remove`
- العُقد: `node.list`، و`node.describe`، و`node.pair.list`، و`node.pair.approve`، و`node.pair.reject`، و`node.pair.remove`، و`node.rename`
- المهام: `tasks.list`، و`tasks.get`، و`tasks.cancel`
- التشخيصات: `doctor.memory.status`، و`update.status`

تُحظر أساليب Gateway الأخرى إلى أن تُضاف عمدًا.

## المقارنة مع WebSocket

يظل مسار RPC المعتاد لـ Gateway عبر WebSocket هو واجهة برمجة التطبيقات المفضلة لمستوى التحكم لدى عملاء OpenClaw. استخدم Admin HTTP RPC فقط لأدوات المضيف التي تحتاج إلى سطح طلب/استجابة عبر HTTP.

لا يمكن لعملاء WebSocket ذوي الرمز المشترك الذين لا يملكون هوية جهاز موثوقة التصريح ذاتيًا بنطاقات الإدارة أثناء الاتصال. يتبع Admin HTTP RPC عمدًا نموذج مشغّل HTTP الموثوق الحالي: عندما تكون Plugin ممكّنة، تُعامل مصادقة حامل السر المشترك على أنها وصول كامل للمشغّل إلى هذا السطح الإداري.

## استكشاف الأخطاء وإصلاحها

`404 Not Found`

: Plugin معطّلة، أو لم يُعد تشغيل Gateway منذ تمكينها، أو يُرسل الطلب إلى عملية Gateway مختلفة.

`401 Unauthorized`

: لم يستوفِ الطلب مصادقة HTTP الخاصة بـ Gateway. تحقق من رمز الحامل أو ترويسات هوية الوكيل الموثوق.

`405 Method Not Allowed`

: استخدم الطلب شيئًا غير `POST`.

`413 Payload Too Large`

: تجاوز متن الطلب حد 1 ميغابايت.

`400 INVALID_REQUEST`

: متن الطلب ليس JSON صالحًا، أو حقل `method` مفقود، أو الأسلوب غير موجود في قائمة Plugin المسموح بها، أو معرّف استئناف التعليق لا يطابق المدة النشطة.

`503 UNAVAILABLE`

: أسلوب Gateway قيد البدء، أو خاضع لتحديد المعدّل، أو معلّق، أو ينتظر عملية تعليق/استئناف متنافسة. افحص `error.details` عند وجوده، والتزم بـ `error.retryAfterMs` قبل إعادة المحاولة.

## ذو صلة

- [نطاقات المشغّل](/ar/gateway/operator-scopes)
- [أمان Gateway](/ar/gateway/security)
- [الوصول عن بُعد](/ar/gateway/remote)
- [بيان Plugin](/ar/plugins/manifest#contracts-reference)
- [المسارات الفرعية لـ SDK](/ar/plugins/sdk-subpaths)
