---
read_when:
    - دمج الأدوات التي تتوقع OpenAI Chat Completions
summary: وفّر نقطة نهاية HTTP متوافقة مع OpenAI على /v1/chat/completions من Gateway
title: إكمالات الدردشة في OpenAI
x-i18n:
    generated_at: "2026-04-30T08:00:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a19f9d9d6d8ce6d605f8af5324ae3eb0c100c167609341c8dfb569970b0b2c9
    source_path: gateway/openai-http-api.md
    workflow: 16
---

يمكن لـ Gateway في OpenClaw تقديم نقطة نهاية صغيرة متوافقة مع OpenAI لـ Chat Completions.

تكون نقطة النهاية هذه **معطّلة افتراضيًا**. فعّلها في الإعدادات أولًا.

- `POST /v1/chat/completions`
- المنفذ نفسه مثل Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

عند تفعيل سطح HTTP المتوافق مع OpenAI في Gateway، فإنه يقدّم أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

داخليًا، تُنفّذ الطلبات كتشغيل عادي لوكيل Gateway (نفس مسار الكود مثل `openclaw agent`)، لذا تتطابق التوجيهات/الأذونات/الإعدادات مع Gateway لديك.

## المصادقة

يستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  `Authorization: Bearer <token-or-password>`
- مصادقة HTTP موثوقة تحمل الهوية (`gateway.auth.mode="trusted-proxy"`):
  وجّه عبر الوكيل المكوّن المدرك للهوية ودعه يحقن
  ترويسات الهوية المطلوبة
- مصادقة مفتوحة لدخول خاص (`gateway.auth.mode="none"`):
  لا يلزم ترويسة مصادقة

ملاحظات:

- عند `gateway.auth.mode="token"`، استخدم `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
- عند `gateway.auth.mode="password"`، استخدم `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
- عند `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر وكيل موثوق مكوّن؛ تتطلب وكلاء loopback على المضيف نفسه
  ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`.
- إذا كان `gateway.auth.rateLimit` مكوّنًا وحدث عدد كبير جدًا من إخفاقات المصادقة، فستعيد نقطة النهاية `429` مع `Retry-After`.

## حد الأمان (مهم)

تعامل مع نقطة النهاية هذه كسطح **وصول كامل للمشغّل** لمثيل Gateway.

- مصادقة HTTP bearer هنا ليست نموذج نطاق ضيقًا لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway صالحة لنقطة النهاية هذه كاعتماد مالك/مشغّل.
- تمر الطلبات عبر مسار وكيل مستوى التحكم نفسه كإجراءات المشغّل الموثوقة.
- لا يوجد حد أدوات منفصل لغير المالك/لكل مستخدم على نقطة النهاية هذه؛ بمجرد أن يجتاز المستدعي مصادقة Gateway هنا، يتعامل OpenClaw مع ذلك المستدعي كمشغّل موثوق لهذا Gateway.
- في أوضاع مصادقة السر المشترك (`token` و`password`)، تستعيد نقطة النهاية الإعدادات الافتراضية العادية الكاملة للمشغّل حتى إذا أرسل المستدعي ترويسة `x-openclaw-scopes` أضيق.
- أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"`) تحترم `x-openclaw-scopes` عند وجودها، وإلا فتعود إلى مجموعة النطاقات الافتراضية العادية للمشغّل.
- إذا كانت سياسة الوكيل الهدف تسمح بأدوات حساسة، فيمكن لنقطة النهاية هذه استخدامها.
- أبقِ نقطة النهاية هذه على loopback/tailnet/دخول خاص فقط؛ لا تعرضها مباشرة على الإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت حيازة سر مشغّل Gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - يتعامل مع أدوار المحادثة على نقطة النهاية هذه كأدوار مرسل المالك
- أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على دخول خاص)
  - تصادق بعض الهوية الخارجية الموثوقة أو حد النشر
  - تحترم `x-openclaw-scopes` عند وجود الترويسة
  - تعود إلى مجموعة نطاقات المشغّل الافتراضية العادية عند غياب الترويسة
  - لا تفقد دلالات المالك إلا عندما يضيّق المستدعي النطاقات صراحة ويحذف `operator.admin`

راجع [الأمان](/ar/gateway/security) و[الوصول عن بُعد](/ar/gateway/remote).

## عقد نموذج يقدّم الوكيل أولًا

يتعامل OpenClaw مع حقل `model` في OpenAI كـ **هدف وكيل**، وليس معرّف نموذج مزوّد خامًا.

- `model: "openclaw"` يوجّه إلى الوكيل الافتراضي المكوّن.
- `model: "openclaw/default"` يوجّه أيضًا إلى الوكيل الافتراضي المكوّن.
- `model: "openclaw/<agentId>"` يوجّه إلى وكيل محدد.

ترويسات الطلب الاختيارية:

- `x-openclaw-model: <provider/model-or-bare-id>` يتجاوز نموذج الخلفية للوكيل المحدد.
- `x-openclaw-agent-id: <agentId>` يبقى مدعومًا كتجاوز توافق.
- `x-openclaw-session-key: <sessionKey>` يتحكم بالكامل في توجيه الجلسة.
- `x-openclaw-message-channel: <channel>` يضبط سياق قناة الدخول الاصطناعية للمطالبات والسياسات المدركة للقناة.

أسماء التوافق المستعارة التي لا تزال مقبولة:

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

افتراضيًا، تكون نقطة النهاية **بلا حالة لكل طلب** (يُنشأ مفتاح جلسة جديد في كل استدعاء).

إذا تضمّن الطلب سلسلة OpenAI `user`، فسيشتق Gateway مفتاح جلسة ثابتًا منها، بحيث يمكن للاستدعاءات المتكررة مشاركة جلسة وكيل.

## لماذا هذا السطح مهم

هذه هي مجموعة التوافق الأعلى أثرًا للواجهات الأمامية والأدوات المستضافة ذاتيًا:

- تتوقع معظم إعدادات Open WebUI وLobeChat وLibreChat وجود `/v1/models`.
- تتوقع كثير من أنظمة RAG وجود `/v1/embeddings`.
- يمكن لعملاء محادثة OpenAI الحاليين عادةً البدء باستخدام `/v1/chat/completions`.
- يفضّل العملاء الأكثر اعتمادًا على الوكلاء أصلًا `/v1/responses` بشكل متزايد.

## قائمة النماذج وتوجيه الوكلاء

<AccordionGroup>
  <Accordion title="ماذا يعيد `/v1/models`؟">
    قائمة أهداف وكلاء OpenClaw.

    المعرّفات المعادة هي إدخالات `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
    استخدمها مباشرة كقيم `model` في OpenAI.

  </Accordion>
  <Accordion title="هل يسرد `/v1/models` وكلاء أم وكلاء فرعيين؟">
    يسرد أهداف الوكلاء عالية المستوى، وليس نماذج مزوّدي الخلفية ولا الوكلاء الفرعيين.

    تبقى الوكلاء الفرعية بنية تنفيذ داخلية. ولا تظهر كنماذج زائفة.

  </Accordion>
  <Accordion title="لماذا تم تضمين `openclaw/default`؟">
    `openclaw/default` هو الاسم المستعار الثابت للوكيل الافتراضي المكوّن.

    هذا يعني أن العملاء يمكنهم الاستمرار في استخدام معرّف واحد متوقع حتى إذا تغيّر معرّف الوكيل الافتراضي الحقيقي بين البيئات.

  </Accordion>
  <Accordion title="كيف أتجاوز نموذج الخلفية؟">
    استخدم `x-openclaw-model`.

    أمثلة:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    إذا حذفته، فسيعمل الوكيل المحدد بخيار النموذج العادي المكوّن له.

  </Accordion>
  <Accordion title="كيف تندرج التضمينات ضمن هذا العقد؟">
    يستخدم `/v1/embeddings` معرّفات `model` نفسها الخاصة بهدف الوكيل.

    استخدم `model: "openclaw/default"` أو `model: "openclaw/<agentId>"`.
    عندما تحتاج إلى نموذج تضمين محدد، أرسله في `x-openclaw-model`.
    من دون تلك الترويسة، يمر الطلب إلى إعداد التضمين العادي للوكيل المحدد.

  </Accordion>
</AccordionGroup>

## البث (SSE)

اضبط `stream: true` لتلقي أحداث مرسلة من الخادم (SSE):

- `Content-Type: text/event-stream`
- كل سطر حدث هو `data: <json>`
- ينتهي البث بـ `data: [DONE]`

## إعداد Open WebUI السريع

لاتصال Open WebUI أساسي:

- عنوان URL الأساسي: `http://127.0.0.1:18789/v1`
- عنوان URL الأساسي لـ Docker على macOS: `http://host.docker.internal:18789/v1`
- مفتاح API: رمز bearer الخاص بـ Gateway لديك
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

إذا أعاد ذلك `openclaw/default`، فيمكن لمعظم إعدادات Open WebUI الاتصال باستخدام عنوان URL الأساسي والرمز نفسيهما.

## أمثلة

بلا بث:

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

- يعيد `/v1/models` أهداف وكلاء OpenClaw، وليس فهارس مزوّدين خامة.
- يكون `openclaw/default` موجودًا دائمًا حتى يعمل معرّف ثابت واحد عبر البيئات.
- تنتمي تجاوزات مزوّد/نموذج الخلفية إلى `x-openclaw-model`، وليس إلى حقل OpenAI `model`.
- يدعم `/v1/embeddings` القيمة `input` كسلسلة أو مصفوفة سلاسل.

## ذات صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [OpenAI](/ar/providers/openai)
