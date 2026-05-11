---
read_when:
    - دمج الأدوات التي تتوقع إكمالات المحادثة من OpenAI
summary: وفّر نقطة نهاية HTTP متوافقة مع OpenAI للمسار /v1/chat/completions من Gateway
title: إكمالات الدردشة من OpenAI
x-i18n:
    generated_at: "2026-05-11T20:32:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e71e25fc1299754ebc65d3998834dc5e9c03acfbd005387aef96f946be1d04a1
    source_path: gateway/openai-http-api.md
    workflow: 16
---

يمكن أن يوفّر Gateway الخاص بـ OpenClaw نقطة نهاية صغيرة متوافقة مع OpenAI لإكمالات المحادثة.

تكون نقطة النهاية هذه **معطّلة افتراضيًا**. فعّلها أولًا في الإعدادات.

- `POST /v1/chat/completions`
- المنفذ نفسه مثل Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

عند تفعيل سطح HTTP المتوافق مع OpenAI في Gateway، فإنه يوفّر أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

في الخلفية، تُنفَّذ الطلبات كتشغيل عادي لوكيل Gateway (مسار التعليمات البرمجية نفسه مثل `openclaw agent`)، لذلك يتطابق التوجيه/الأذونات/الإعدادات مع Gateway لديك.

## المصادقة

يستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  `Authorization: Bearer <token-or-password>`
- مصادقة HTTP موثوقة تحمل هوية (`gateway.auth.mode="trusted-proxy"`):
  وجّه عبر الوكيل المهيأ والمدرك للهوية ودعه يحقن
  ترويسات الهوية المطلوبة
- مصادقة مفتوحة عبر دخول خاص (`gateway.auth.mode="none"`):
  لا يلزم وجود ترويسة مصادقة

ملاحظات:

- عند `gateway.auth.mode="token"`، استخدم `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
- عند `gateway.auth.mode="password"`، استخدم `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
- عند `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر وكيل موثوق مهيأ؛ وتتطلب وكلاء loopback على المضيف نفسه تفعيلًا صريحًا لـ
  `gateway.auth.trustedProxy.allowLoopback = true`.
- إذا كان `gateway.auth.rateLimit` مهيأً وحدث عدد كبير جدًا من حالات فشل المصادقة، تُرجع نقطة النهاية `429` مع `Retry-After`.

## حد الأمان (مهم)

تعامل مع نقطة النهاية هذه كسطح **وصول كامل للمشغّل** لمثيل Gateway.

- مصادقة حامل HTTP هنا ليست نموذج نطاق ضيق لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway صالحة لنقطة النهاية هذه كاعتماد مالك/مشغّل.
- تمر الطلبات عبر مسار وكيل مستوى التحكم نفسه مثل إجراءات المشغّل الموثوق.
- لا يوجد حد أدوات منفصل لغير المالك/لكل مستخدم على نقطة النهاية هذه؛ بمجرد أن يجتاز المتصل مصادقة Gateway هنا، يعامل OpenClaw ذلك المتصل كمشغّل موثوق لهذا Gateway.
- في أوضاع مصادقة السر المشترك (`token` و`password`)، تستعيد نقطة النهاية افتراضيات المشغّل الكاملة العادية حتى إذا أرسل المتصل ترويسة `x-openclaw-scopes` أضيق.
- تحترم أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"`) ترويسة `x-openclaw-scopes` عند وجودها، وإلا تعود إلى مجموعة النطاقات الافتراضية العادية للمشغّل.
- إذا كانت سياسة الوكيل الهدف تسمح بالأدوات الحساسة، فيمكن لنقطة النهاية هذه استخدامها.
- أبقِ نقطة النهاية هذه على loopback/tailnet/دخول خاص فقط؛ لا تعرّضها مباشرة للإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر مشغّل Gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - يعامل أدوار المحادثة على نقطة النهاية هذه كأدوار مرسل-مالك
- أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على دخول خاص)
  - تصادق هوية خارجية موثوقة أو حد نشر معيّن
  - تحترم `x-openclaw-scopes` عند وجود الترويسة
  - تعود إلى مجموعة نطاقات المشغّل الافتراضية العادية عند غياب الترويسة
  - لا تفقد دلالات المالك إلا عندما يضيّق المتصل النطاقات صراحةً ويحذف `operator.admin`

راجع [الأمان](/ar/gateway/security) و[الوصول عن بُعد](/ar/gateway/remote).

## عقد نموذج الوكيل أولًا

يتعامل OpenClaw مع حقل OpenAI `model` كـ **هدف وكيل**، وليس معرّف نموذج مزوّد خامًا.

- `model: "openclaw"` يوجّه إلى الوكيل الافتراضي المهيأ.
- `model: "openclaw/default"` يوجّه أيضًا إلى الوكيل الافتراضي المهيأ.
- `model: "openclaw/<agentId>"` يوجّه إلى وكيل محدد.

ترويسات الطلب الاختيارية:

- `x-openclaw-model: <provider/model-or-bare-id>` يتجاوز نموذج الخلفية للوكيل المحدد.
- `x-openclaw-agent-id: <agentId>` لا يزال مدعومًا كتجاوز توافق.
- `x-openclaw-session-key: <sessionKey>` يتحكم بالكامل في توجيه الجلسة.
- `x-openclaw-message-channel: <channel>` يحدد سياق قناة الدخول الاصطناعي للمطالبات والسياسات المدركة للقناة.

أسماء التوافق البديلة التي لا تزال مقبولة:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## تفعيل نقطة النهاية

اضبط `gateway.http.endpoints.chatCompletions.enabled` على `true`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

## تعطيل نقطة النهاية

اضبط `gateway.http.endpoints.chatCompletions.enabled` على `false`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

## سلوك الجلسة

تكون نقطة النهاية افتراضيًا **عديمة الحالة لكل طلب** (يُنشأ مفتاح جلسة جديد في كل استدعاء).

إذا تضمّن الطلب سلسلة OpenAI `user`، يشتق Gateway مفتاح جلسة مستقرًا منها، بحيث يمكن للاستدعاءات المتكررة مشاركة جلسة وكيل.

## لماذا يهم هذا السطح

هذه هي مجموعة التوافق الأعلى أثرًا للواجهات الأمامية والأدوات ذاتية الاستضافة:

- تتوقع معظم إعدادات Open WebUI وLobeChat وLibreChat وجود `/v1/models`.
- تتوقع العديد من أنظمة RAG وجود `/v1/embeddings`.
- يمكن لعملاء محادثة OpenAI الحاليين عادةً البدء بـ `/v1/chat/completions`.
- يفضّل العملاء الأكثر اعتمادًا على الوكلاء بشكل متزايد `/v1/responses`.

## قائمة النماذج وتوجيه الوكلاء

<AccordionGroup>
  <Accordion title="ماذا يُرجع `/v1/models`؟">
    قائمة أهداف وكلاء OpenClaw.

    المعرّفات المُرجعة هي إدخالات `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
    استخدمها مباشرة كقيم OpenAI `model`.

  </Accordion>
  <Accordion title="هل يسرد `/v1/models` الوكلاء أم الوكلاء الفرعيين؟">
    يسرد أهداف الوكلاء ذات المستوى الأعلى، وليس نماذج مزوّد الخلفية ولا الوكلاء الفرعيين.

    تظل الوكلاء الفرعيون جزءًا من طوبولوجيا التنفيذ الداخلية. ولا تظهر كنماذج زائفة.

  </Accordion>
  <Accordion title="لماذا تم تضمين `openclaw/default`؟">
    `openclaw/default` هو الاسم البديل المستقر للوكيل الافتراضي المهيأ.

    وهذا يعني أن العملاء يمكنهم الاستمرار في استخدام معرّف واحد متوقع حتى إذا تغيّر معرّف الوكيل الافتراضي الحقيقي بين البيئات.

  </Accordion>
  <Accordion title="كيف أتجاوز نموذج الخلفية؟">
    استخدم `x-openclaw-model`.

    أمثلة:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    إذا حذفته، يعمل الوكيل المحدد بخيار النموذج المهيأ العادي الخاص به.

  </Accordion>
  <Accordion title="كيف تتوافق التضمينات مع هذا العقد؟">
    يستخدم `/v1/embeddings` معرّفات `model` نفسها الخاصة بأهداف الوكيل.

    استخدم `model: "openclaw/default"` أو `model: "openclaw/<agentId>"`.
    عندما تحتاج إلى نموذج تضمين محدد، أرسله في `x-openclaw-model`.
    بدون تلك الترويسة، يمر الطلب إلى إعداد التضمين العادي للوكيل المحدد.

  </Accordion>
</AccordionGroup>

## البث (SSE)

اضبط `stream: true` لتلقي أحداث مرسلة من الخادم (SSE):

- `Content-Type: text/event-stream`
- كل سطر حدث هو `data: <json>`
- ينتهي البث بـ `data: [DONE]`

## عقد أدوات المحادثة

يدعم `/v1/chat/completions` مجموعة فرعية من أدوات الدوال متوافقة مع عملاء محادثة OpenAI الشائعين.

### حقول الطلب المدعومة

- `tools`: مصفوفة من `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- أدوار متابعة `messages[*].role: "tool"`
- `messages[*].tool_call_id` لربط نتائج الأدوات باستدعاء أداة سابق

### المتغيرات غير المدعومة

تُرجع نقطة النهاية `400 invalid_request_error` لمتغيرات الأدوات غير المدعومة، بما في ذلك:

- `tools` ليست مصفوفة
- إدخالات أدوات ليست من نوع function
- `tool.function.name` مفقود
- متغيرات `tool_choice` مثل `allowed_tools` و`custom`
- `tool_choice: "required"` (لا يُفرض بعد وقت التشغيل؛ سيدعم بمجرد تنفيذ الفرض الصارم)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (نفس مبرر `required`)
- قيم `tool_choice.function.name` التي لا تطابق `tools` المقدمة

### شكل استجابة الأدوات غير المبثوثة

عندما يقرر الوكيل استدعاء الأدوات، تستخدم الاستجابة:

- `choices[0].finish_reason = "tool_calls"`
- إدخالات `choices[0].message.tool_calls[]` مع:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (سلسلة JSON)

تُرجع تعليقات المساعد قبل استدعاء الأداة في `choices[0].message.content` (قد تكون فارغة).

### شكل استجابة الأدوات المبثوثة

عند `stream: true`، تُرسل استدعاءات الأدوات كقطع SSE تزايدية:

- دلتا أولية لدور المساعد
- دلتات اختيارية لتعليقات المساعد
- قطعة واحدة أو أكثر من `delta.tool_calls` تحمل هوية الأداة وأجزاء الوسائط
- قطعة نهائية مع `finish_reason: "tool_calls"`
- `data: [DONE]`

إذا كان `stream_options.include_usage=true`، تُرسل قطعة استخدام ختامية قبل `[DONE]`.

### حلقة متابعة الأدوات

بعد تلقي `tool_calls`، يجب على العميل تنفيذ الدالة/الدوال المطلوبة وإرسال طلب متابعة يتضمن:

- رسالة استدعاء أداة المساعد السابقة
- رسالة واحدة أو أكثر من `role: "tool"` مع `tool_call_id` مطابق

يتيح هذا لتشغيل وكيل Gateway متابعة حلقة التفكير نفسها وإنتاج إجابة المساعد النهائية.

## إعداد سريع لـ Open WebUI

لاتصال Open WebUI أساسي:

- عنوان URL الأساسي: `http://127.0.0.1:18789/v1`
- عنوان URL الأساسي لـ Docker على macOS: `http://host.docker.internal:18789/v1`
- مفتاح API: رمز حامل Gateway الخاص بك
- النموذج: `openclaw/default`

السلوك المتوقع:

- يجب أن يسرد `GET /v1/models` القيمة `openclaw/default`
- يجب أن يستخدم Open WebUI القيمة `openclaw/default` كمعرّف نموذج المحادثة
- إذا أردت مزوّد/نموذج خلفية محددًا لذلك الوكيل، فاضبط النموذج الافتراضي العادي للوكيل أو أرسل `x-openclaw-model`

اختبار سريع:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

إذا أعاد ذلك `openclaw/default`، فيمكن لمعظم إعدادات Open WebUI الاتصال بعنوان URL الأساسي والرمز نفسيهما.

## أمثلة

بدون بث:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

بث:

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/gpt-5.4' \
  -d '{
    "model": "openclaw/research",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```

سرد النماذج:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

جلب نموذج واحد:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

إنشاء تضمينات:

```bash
curl -sS http://127.0.0.1:18789/v1/embeddings \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-model: openai/text-embedding-3-small' \
  -d '{
    "model": "openclaw/default",
    "input": ["alpha", "beta"]
  }'
```

ملاحظات:

- يُرجع `/v1/models` أهداف وكلاء OpenClaw، وليس كتالوجات المزوّدين الخام.
- يكون `openclaw/default` موجودًا دائمًا بحيث يعمل معرّف واحد مستقر عبر البيئات.
- تنتمي تجاوزات مزوّد/نموذج الخلفية إلى `x-openclaw-model`، وليس إلى حقل OpenAI `model`.
- يدعم `/v1/embeddings` قيمة `input` كسلسلة أو مصفوفة سلاسل.

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [OpenAI](/ar/providers/openai)
