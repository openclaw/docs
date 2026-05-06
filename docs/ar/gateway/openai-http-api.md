---
read_when:
    - دمج الأدوات التي تتوقع OpenAI Chat Completions
summary: وفّر نقطة نهاية HTTP متوافقة مع OpenAI على /v1/chat/completions من Gateway
title: إكمالات الدردشة من OpenAI
x-i18n:
    generated_at: "2026-05-06T07:55:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

يمكن لـGateway في OpenClaw تقديم نقطة نهاية Chat Completions صغيرة متوافقة مع OpenAI.

نقطة النهاية هذه **معطّلة افتراضيًا**. فعّلها في الإعدادات أولًا.

- `POST /v1/chat/completions`
- المنفذ نفسه مثل Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

عند تفعيل سطح HTTP المتوافق مع OpenAI في Gateway، فإنه يقدّم أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

في الخلفية، تُنفَّذ الطلبات كتشغيل عادي لوكيل Gateway (مسار الشيفرة نفسه مثل `openclaw agent`)، لذلك تتطابق التوجيهات/الأذونات/الإعدادات مع Gateway لديك.

## المصادقة

يستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  `Authorization: Bearer <token-or-password>`
- مصادقة HTTP موثوقة تحمل الهوية (`gateway.auth.mode="trusted-proxy"`):
  مرّر عبر الوكيل المهيأ والواعي بالهوية ودعه يحقن
  ترويسات الهوية المطلوبة
- مصادقة مفتوحة لدخول خاص (`gateway.auth.mode="none"`):
  لا يلزم ترويس مصادقة

ملاحظات:

- عند `gateway.auth.mode="token"`، استخدم `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
- عند `gateway.auth.mode="password"`، استخدم `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
- عند `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر وكيل موثوق مهيأ؛ تتطلب وكلاء loopback من المضيف نفسه ضبطًا صريحًا
  `gateway.auth.trustedProxy.allowLoopback = true`.
- إذا كان `gateway.auth.rateLimit` مهيأ وحدثت إخفاقات مصادقة كثيرة جدًا، فستعيد نقطة النهاية `429` مع `Retry-After`.

## حد الأمان (مهم)

عامل نقطة النهاية هذه كسطح **وصول كامل للمشغّل** لمثيل Gateway.

- مصادقة حامل HTTP هنا ليست نموذج نطاق ضيق لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway الصالحين لنقطة النهاية هذه كاعتماد مالك/مشغّل.
- تمر الطلبات عبر مسار وكيل مستوى التحكم نفسه مثل إجراءات المشغّل الموثوقة.
- لا يوجد حد أدوات منفصل لغير المالك/لكل مستخدم في نقطة النهاية هذه؛ بمجرد أن يجتاز المستدعي مصادقة Gateway هنا، يتعامل OpenClaw مع ذلك المستدعي كمشغّل موثوق لهذا Gateway.
- في أوضاع مصادقة السر المشترك (`token` و`password`)، تستعيد نقطة النهاية افتراضيات المشغّل الكاملة العادية حتى إذا أرسل المستدعي ترويسة `x-openclaw-scopes` أضيق.
- تكرّم أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"`) ترويسة `x-openclaw-scopes` عند وجودها، وإلا فتعود إلى مجموعة النطاقات الافتراضية العادية للمشغّل.
- إذا كانت سياسة الوكيل الهدف تسمح بأدوات حساسة، يمكن لنقطة النهاية هذه استخدامها.
- أبقِ نقطة النهاية هذه على loopback/شبكة tailnet/دخول خاص فقط؛ لا تكشفها مباشرة على الإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر مشغّل Gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - يتعامل مع أدوار المحادثة في نقطة النهاية هذه كأدوار مرسل مالك
- أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على دخول خاص)
  - تصادق على هوية خارجية موثوقة أو حد نشر
  - تكرّم `x-openclaw-scopes` عند وجود الترويسة
  - تعود إلى مجموعة نطاقات المشغّل الافتراضية العادية عند غياب الترويسة
  - لا تفقد دلالات المالك إلا عندما يضيّق المستدعي النطاقات صراحة ويحذف `operator.admin`

راجع [الأمان](/ar/gateway/security) و[الوصول عن بُعد](/ar/gateway/remote).

## عقد النموذج المعتمد على الوكيل أولًا

يتعامل OpenClaw مع حقل OpenAI `model` كـ**هدف وكيل**، وليس معرّف نموذج مزوّد خامًا.

- `model: "openclaw"` يوجّه إلى الوكيل الافتراضي المهيأ.
- `model: "openclaw/default"` يوجّه أيضًا إلى الوكيل الافتراضي المهيأ.
- `model: "openclaw/<agentId>"` يوجّه إلى وكيل محدد.

ترويسات الطلب الاختيارية:

- `x-openclaw-model: <provider/model-or-bare-id>` يتجاوز نموذج الخلفية للوكيل المحدد.
- `x-openclaw-agent-id: <agentId>` يظل مدعومًا كتجاوز للتوافق.
- `x-openclaw-session-key: <sessionKey>` يتحكم بالكامل في توجيه الجلسة.
- `x-openclaw-message-channel: <channel>` يضبط سياق قناة الدخول الاصطناعية للمطالبات والسياسات الواعية بالقناة.

أسماء التوافق المستعارة التي ما زالت مقبولة:

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

افتراضيًا، تكون نقطة النهاية **عديمة الحالة لكل طلب** (يُولَّد مفتاح جلسة جديد مع كل استدعاء).

إذا تضمن الطلب سلسلة OpenAI `user`، يشتق Gateway مفتاح جلسة ثابتًا منها، بحيث يمكن للاستدعاءات المتكررة مشاركة جلسة وكيل.

## لماذا يهم هذا السطح

هذه هي مجموعة التوافق الأعلى أثرًا للواجهات الأمامية والأدوات ذات الاستضافة الذاتية:

- تتوقع معظم إعدادات Open WebUI وLobeChat وLibreChat وجود `/v1/models`.
- تتوقع كثير من أنظمة RAG وجود `/v1/embeddings`.
- يمكن لعملاء محادثة OpenAI الحاليين عادةً البدء باستخدام `/v1/chat/completions`.
- يفضّل المزيد من العملاء الأصليين للوكلاء بشكل متزايد `/v1/responses`.

## قائمة النماذج وتوجيه الوكيل

<AccordionGroup>
  <Accordion title="ماذا يعيد `/v1/models`؟">
    قائمة أهداف وكلاء OpenClaw.

    المعرّفات المعادة هي إدخالات `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
    استخدمها مباشرة كقيم OpenAI `model`.

  </Accordion>
  <Accordion title="هل يسرد `/v1/models` الوكلاء أم الوكلاء الفرعيين؟">
    يسرد أهداف الوكلاء من المستوى الأعلى، لا نماذج مزوّدي الخلفية ولا الوكلاء الفرعيين.

    تظل الوكلاء الفرعيون طوبولوجيا تنفيذ داخلية. لا تظهر كنماذج زائفة.

  </Accordion>
  <Accordion title="لماذا تم تضمين `openclaw/default`؟">
    `openclaw/default` هو الاسم المستعار الثابت للوكيل الافتراضي المهيأ.

    وهذا يعني أن العملاء يستطيعون الاستمرار في استخدام معرّف واحد يمكن التنبؤ به حتى إذا تغيّر معرّف الوكيل الافتراضي الحقيقي بين البيئات.

  </Accordion>
  <Accordion title="كيف أتجاوز نموذج الخلفية؟">
    استخدم `x-openclaw-model`.

    أمثلة:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    إذا حذفته، يعمل الوكيل المحدد باختيار النموذج العادي المهيأ له.

  </Accordion>
  <Accordion title="كيف تتناسب التضمينات مع هذا العقد؟">
    يستخدم `/v1/embeddings` معرّفات `model` نفسها الخاصة بأهداف الوكلاء.

    استخدم `model: "openclaw/default"` أو `model: "openclaw/<agentId>"`.
    عندما تحتاج إلى نموذج تضمين محدد، أرسله في `x-openclaw-model`.
    بدون هذه الترويسة، يمر الطلب إلى إعداد التضمين العادي للوكيل المحدد.

  </Accordion>
</AccordionGroup>

## البث (SSE)

اضبط `stream: true` لتلقي الأحداث المرسلة من الخادم (SSE):

- `Content-Type: text/event-stream`
- كل سطر حدث هو `data: <json>`
- ينتهي البث بـ`data: [DONE]`

## إعداد Open WebUI السريع

لاتصال Open WebUI أساسي:

- عنوان URL الأساسي: `http://127.0.0.1:18789/v1`
- عنوان URL الأساسي لـDocker على macOS: `http://host.docker.internal:18789/v1`
- مفتاح API: رمز حامل Gateway لديك
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

إذا أعاد ذلك `openclaw/default`، يمكن لمعظم إعدادات Open WebUI الاتصال باستخدام عنوان URL الأساسي والرمز نفسيهما.

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

البث:

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

- يعيد `/v1/models` أهداف وكلاء OpenClaw، وليس كتالوجات المزوّدين الخام.
- `openclaw/default` موجود دائمًا، لذلك يعمل معرّف ثابت واحد عبر البيئات.
- مكان تجاوزات مزوّد/نموذج الخلفية هو `x-openclaw-model`، وليس حقل OpenAI `model`.
- يدعم `/v1/embeddings` قيمة `input` كسلسلة أو مصفوفة سلاسل.

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [OpenAI](/ar/providers/openai)
