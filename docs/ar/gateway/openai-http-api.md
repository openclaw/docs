---
read_when:
    - دمج الأدوات التي تتوقع OpenAI Chat Completions
summary: وفّر نقطة نهاية HTTP متوافقة مع OpenAI لمسار /v1/chat/completions من Gateway
title: إكمالات الدردشة في OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

يمكن لـ Gateway في OpenClaw تقديم نقطة نهاية Chat Completions صغيرة متوافقة مع OpenAI.

تكون نقطة النهاية هذه **معطّلة افتراضيًا**. فعّلها في الإعدادات أولًا.

- `POST /v1/chat/completions`
- نفس منفذ Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

عند تفعيل سطح HTTP المتوافق مع OpenAI في Gateway، فإنه يقدّم أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

داخليًا، تُنفّذ الطلبات كتشغيل عادي لوكيل Gateway (مسار الكود نفسه مثل `openclaw agent`)، لذلك تتطابق إعدادات التوجيه/الأذونات/التكوين مع Gateway لديك.

## المصادقة

تستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  `Authorization: Bearer <token-or-password>`
- مصادقة HTTP الموثوقة الحاملة للهوية (`gateway.auth.mode="trusted-proxy"`):
  وجّه عبر الوكيل المكوّن والواعي بالهوية ودعه يحقن
  ترويسات الهوية المطلوبة
- مصادقة مفتوحة لدخول خاص (`gateway.auth.mode="none"`):
  لا يلزم وجود ترويسة مصادقة

ملاحظات:

- عند `gateway.auth.mode="token"`، استخدم `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
- عند `gateway.auth.mode="password"`، استخدم `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
- عند `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر وكيل موثوق مكوّن؛ وتتطلب وكلاء local loopback على المضيف نفسه ضبطًا صريحًا لـ
  `gateway.auth.trustedProxy.allowLoopback = true`.
- إذا كان `gateway.auth.rateLimit` مكوّنًا وحدث عدد كبير جدًا من إخفاقات المصادقة، فترجع نقطة النهاية `429` مع `Retry-After`.

## حد الأمان (مهم)

عامل نقطة النهاية هذه كسطح **وصول كامل للمشغّل** لمثيل Gateway.

- مصادقة حامل HTTP هنا ليست نموذج نطاق ضيقًا لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway صالحة لنقطة النهاية هذه كبيانات اعتماد مالك/مشغّل.
- تمر الطلبات عبر مسار وكيل مستوى التحكم نفسه مثل إجراءات المشغّل الموثوقة.
- لا يوجد حد أدوات منفصل لغير المالك/لكل مستخدم على نقطة النهاية هذه؛ بمجرد أن يجتاز المستدعي مصادقة Gateway هنا، يعامل OpenClaw ذلك المستدعي كمشغّل موثوق لهذا Gateway.
- في أوضاع مصادقة السر المشترك (`token` و`password`)، تعيد نقطة النهاية الإعدادات الافتراضية العادية الكاملة للمشغّل حتى إذا أرسل المستدعي ترويسة `x-openclaw-scopes` أضيق.
- تحترم أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"`) ترويسة `x-openclaw-scopes` عند وجودها، وإلا فتعود إلى مجموعة نطاقات المشغّل الافتراضية العادية.
- إذا كانت سياسة الوكيل الهدف تسمح بأدوات حساسة، يمكن لنقطة النهاية هذه استخدامها.
- أبقِ نقطة النهاية هذه على loopback/tailnet/دخول خاص فقط؛ لا تعرضها مباشرة على الإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر مشغّل Gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - يعامل دورات المحادثة على نقطة النهاية هذه كدورات مُرسلة من المالك
- أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على دخول خاص)
  - تصادق هوية موثوقة خارجية ما أو حد نشر
  - تحترم `x-openclaw-scopes` عند وجود الترويسة
  - تعود إلى مجموعة نطاقات المشغّل الافتراضية العادية عند غياب الترويسة
  - لا تفقد دلالات المالك إلا عندما يضيّق المستدعي النطاقات صراحة ويحذف `operator.admin`

راجع [الأمان](/ar/gateway/security) و[الوصول البعيد](/ar/gateway/remote).

## عقد نموذج يعطي الأولوية للوكيل

يعامل OpenClaw حقل OpenAI `model` كـ **هدف وكيل**، وليس معرّف نموذج مزوّد خامًا.

- `model: "openclaw"` يوجّه إلى الوكيل الافتراضي المكوّن.
- `model: "openclaw/default"` يوجّه أيضًا إلى الوكيل الافتراضي المكوّن.
- `model: "openclaw/<agentId>"` يوجّه إلى وكيل محدد.

ترويسات الطلب الاختيارية:

- `x-openclaw-model: <provider/model-or-bare-id>` يتجاوز نموذج الواجهة الخلفية للوكيل المحدد.
- `x-openclaw-agent-id: <agentId>` يبقى مدعومًا كتجاوز توافق.
- `x-openclaw-session-key: <sessionKey>` يتحكم بالكامل في توجيه الجلسة.
- `x-openclaw-message-channel: <channel>` يضبط سياق قناة الدخول الاصطناعية للمطالبات والسياسات الواعية بالقناة.

لا تزال الأسماء المستعارة للتوافق مقبولة:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## تفعيل نقطة النهاية

اضبط `gateway.http.endpoints.chatCompletions.enabled` إلى `true`:

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

اضبط `gateway.http.endpoints.chatCompletions.enabled` إلى `false`:

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

افتراضيًا، تكون نقطة النهاية **عديمة الحالة لكل طلب** (يُنشأ مفتاح جلسة جديد مع كل استدعاء).

إذا تضمّن الطلب سلسلة OpenAI `user`، يشتق Gateway مفتاح جلسة ثابتًا منها، بحيث يمكن للاستدعاءات المتكررة مشاركة جلسة وكيل.

## لماذا يهم هذا السطح

هذه هي مجموعة التوافق الأعلى قيمة للواجهات الأمامية والأدوات ذاتية الاستضافة:

- تتوقع معظم إعدادات Open WebUI وLobeChat وLibreChat وجود `/v1/models`.
- تتوقع العديد من أنظمة RAG وجود `/v1/embeddings`.
- يمكن لعملاء محادثة OpenAI الحاليين عادةً البدء بـ `/v1/chat/completions`.
- يفضّل عملاء أكثر أصالة للوكيل بشكل متزايد `/v1/responses`.

## قائمة النماذج وتوجيه الوكيل

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    قائمة أهداف وكلاء OpenClaw.

    المعرّفات المرجعة هي إدخالات `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
    استخدمها مباشرة كقيم OpenAI `model`.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    يسرد أهداف وكلاء المستوى الأعلى، وليس نماذج مزوّدي الواجهة الخلفية ولا الوكلاء الفرعيين.

    تبقى الوكلاء الفرعيون طوبولوجيا تنفيذ داخلية. لا تظهر كنماذج صورية.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` هو الاسم المستعار الثابت للوكيل الافتراضي المكوّن.

    هذا يعني أن العملاء يمكنهم الاستمرار في استخدام معرّف واحد قابل للتنبؤ حتى إذا تغيّر معرّف الوكيل الافتراضي الحقيقي بين البيئات.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    استخدم `x-openclaw-model`.

    أمثلة:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    إذا حذفته، يعمل الوكيل المحدد بخيار النموذج العادي المكوّن له.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    يستخدم `/v1/embeddings` معرّفات `model` نفسها الخاصة بهدف الوكيل.

    استخدم `model: "openclaw/default"` أو `model: "openclaw/<agentId>"`.
    عندما تحتاج إلى نموذج تضمين محدد، أرسله في `x-openclaw-model`.
    بدون تلك الترويسة، يمر الطلب إلى إعداد التضمين العادي للوكيل المحدد.

  </Accordion>
</AccordionGroup>

## البث (SSE)

اضبط `stream: true` لتلقي Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- كل سطر حدث هو `data: <json>`
- ينتهي البث بـ `data: [DONE]`

## عقد أدوات المحادثة

يدعم `/v1/chat/completions` مجموعة فرعية من أدوات الدوال متوافقة مع عملاء OpenAI Chat الشائعين.

### حقول الطلب المدعومة

- `tools`: مصفوفة من `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- دورات متابعة `messages[*].role: "tool"`
- `messages[*].tool_call_id` لربط نتائج الأدوات باستدعاء أداة سابق
- `max_completion_tokens`: رقم؛ حد لكل استدعاء لإجمالي رموز الإكمال (بما في ذلك رموز الاستدلال). اسم حقل OpenAI Chat Completions الحالي؛ مفضّل عند إرسال كل من `max_completion_tokens` و`max_tokens`.
- `max_tokens`: رقم؛ اسم مستعار قديم مقبول للتوافق الخلفي. يُتجاهل عند وجود `max_completion_tokens` أيضًا.

عند ضبط أي من الحقلين، تُمرّر القيمة إلى المزوّد الأعلى عبر قناة معاملات بث الوكيل. يختار نقل المزوّد اسم حقل السلك الفعلي المرسل إلى المزوّد الأعلى: `max_completion_tokens` لنقاط نهاية عائلة OpenAI، و`max_tokens` للمزوّدين الذين لا يقبلون إلا الاسم القديم (مثل Mistral وChutes).

### المتغيرات غير المدعومة

ترجع نقطة النهاية `400 invalid_request_error` لمتغيرات الأدوات غير المدعومة، بما في ذلك:

- `tools` ليست مصفوفة
- إدخالات أدوات ليست من نوع دالة
- `tool.function.name` مفقود
- متغيرات `tool_choice` مثل `allowed_tools` و`custom`
- `tool_choice: "required"` (لا يُفرض بعد في وقت التشغيل؛ سيدعم بمجرد تنفيذ الفرض الصارم)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (نفس مبرر `required`)
- قيم `tool_choice.function.name` التي لا تطابق `tools` المقدمة

### شكل استجابة الأدوات غير المبثوثة

عندما يقرر الوكيل استدعاء أدوات، تستخدم الاستجابة:

- `choices[0].finish_reason = "tool_calls"`
- إدخالات `choices[0].message.tool_calls[]` مع:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (سلسلة JSON)

تُرجع تعليقات المساعد قبل استدعاء الأداة في `choices[0].message.content` (قد تكون فارغة).

### شكل استجابة الأدوات المبثوثة

عند `stream: true`، تنبعث استدعاءات الأدوات كمقاطع SSE تزايدية:

- فرق أولي لدور المساعد
- فروق اختيارية لتعليقات المساعد
- مقطع أو أكثر من `delta.tool_calls` يحمل هوية الأداة وأجزاء الوسيطات
- مقطع نهائي مع `finish_reason: "tool_calls"`
- `data: [DONE]`

إذا كان `stream_options.include_usage=true`، ينبعث مقطع استخدام لاحق قبل `[DONE]`.

### حلقة متابعة الأدوات

بعد تلقي `tool_calls`، يجب على العميل تنفيذ الدالة/الدوال المطلوبة وإرسال طلب متابعة يتضمن:

- رسالة استدعاء أداة المساعد السابقة
- رسالة واحدة أو أكثر من `role: "tool"` مع `tool_call_id` مطابق

يسمح هذا لتشغيل وكيل Gateway بمتابعة حلقة الاستدلال نفسها وإنتاج إجابة المساعد النهائية.

## إعداد سريع لـ Open WebUI

لاتصال Open WebUI أساسي:

- عنوان URL الأساسي: `http://127.0.0.1:18789/v1`
- عنوان URL الأساسي لـ Docker على macOS: `http://host.docker.internal:18789/v1`
- مفتاح API: رمز حامل Gateway الخاص بك
- النموذج: `openclaw/default`

السلوك المتوقع:

- يجب أن يسرد `GET /v1/models` ‏`openclaw/default`
- يجب أن يستخدم Open WebUI ‏`openclaw/default` كمعرّف نموذج المحادثة
- إذا أردت مزوّد/نموذج واجهة خلفية محددًا لذلك الوكيل، فاضبط النموذج الافتراضي العادي للوكيل أو أرسل `x-openclaw-model`

اختبار سريع:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

إذا أعاد ذلك `openclaw/default`، يمكن لمعظم إعدادات Open WebUI الاتصال بعنوان URL الأساسي والرمز نفسيهما.

## أمثلة

غير مبثوث:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

مبثوث:

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

إنشاء التضمينات:

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
- يكون `openclaw/default` موجودًا دائمًا، لذا يعمل معرّف ثابت واحد عبر البيئات.
- تنتمي تجاوزات المزوّد/النموذج في الواجهة الخلفية إلى `x-openclaw-model`، وليس إلى حقل `model` في OpenAI.
- يدعم `/v1/embeddings` استخدام `input` كسلسلة نصية أو مصفوفة من السلاسل النصية.

## ذات صلة

- [مرجع التكوين](/ar/gateway/configuration-reference)
- [OpenAI](/ar/providers/openai)
