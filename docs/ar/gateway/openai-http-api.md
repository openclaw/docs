---
read_when:
    - دمج الأدوات التي تتوقع OpenAI Chat Completions
summary: عرض نقطة نهاية HTTP متوافقة مع OpenAI عند `/v1/chat/completions` من Gateway
title: إكمالات الدردشة OpenAI
x-i18n:
    generated_at: "2026-04-24T07:42:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 55f581d56edbc23a8e8a6f8f1c5960db46042991abb3ee4436f477abafde2926
    source_path: gateway/openai-http-api.md
    workflow: 15
---

# إكمالات الدردشة OpenAI ‏(HTTP)

يمكن لـ Gateway في OpenClaw تقديم نقطة نهاية صغيرة متوافقة مع OpenAI Chat Completions.

تكون نقطة النهاية هذه **معطلة افتراضيًا**. قم بتمكينها في الإعدادات أولًا.

- `POST /v1/chat/completions`
- المنفذ نفسه الخاص بـ Gateway ‏(تعدد إرسال WS + HTTP): ‏`http://<gateway-host>:<port>/v1/chat/completions`

عند تمكين سطح HTTP المتوافق مع OpenAI في Gateway، فإنه يقدّم أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

في الخلفية، تُنفذ الطلبات باعتبارها تشغيل وكيل Gateway عاديًا (المسار البرمجي نفسه مثل `openclaw agent`)، لذلك يتطابق التوجيه/الأذونات/الإعدادات مع Gateway لديك.

## المصادقة

يستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  ‏`Authorization: Bearer <token-or-password>`
- مصادقة HTTP موثوقة حاملة للهوية (`gateway.auth.mode="trusted-proxy"`):
  مرّر الطلب عبر reverse-proxy واعية بالهوية والمضبوطة ودعها تضخ
  رؤوس الهوية المطلوبة
- مصادقة مفتوحة لدخول خاص (`gateway.auth.mode="none"`):
  لا حاجة إلى رأس مصادقة

ملاحظات:

- عندما تكون `gateway.auth.mode="token"`، استخدم `gateway.auth.token` ‏(أو `OPENCLAW_GATEWAY_TOKEN`).
- عندما تكون `gateway.auth.mode="password"`، استخدم `gateway.auth.password` ‏(أو `OPENCLAW_GATEWAY_PASSWORD`).
- عندما تكون `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر trusted proxy غير loopback مضبوط؛ ولا تستوفي proxy المحلية على المضيف نفسه
  هذا الوضع.
- إذا كانت `gateway.auth.rateLimit` مضبوطة وحدث عدد كبير جدًا من إخفاقات المصادقة، فتعيد نقطة النهاية `429` مع `Retry-After`.

## الحد الأمني (مهم)

تعامل مع نقطة النهاية هذه على أنها سطح **وصول مشغّل كامل** لمثيل gateway.

- مصادقة HTTP bearer هنا ليست نموذج نطاق ضيق لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway الصالحة لهذه النقطة على أنها بيانات اعتماد مالك/مشغّل.
- تمر الطلبات عبر مسار وكيل طبقة التحكم نفسه مثل إجراءات المشغّل الموثوق.
- لا يوجد حد أدوات منفصل لغير المالك/لكل مستخدم على هذه النقطة؛ فبمجرد أن يجتاز المتصل مصادقة Gateway هنا، يتعامل OpenClaw مع ذلك المتصل على أنه مشغّل موثوق لهذه gateway.
- بالنسبة إلى أوضاع مصادقة السر المشترك (`token` و`password`)، تستعيد نقطة النهاية القيم الافتراضية الكاملة العادية للمشغّل حتى إذا أرسل المتصل رأس `x-openclaw-scopes` أضيق.
- تحترم أوضاع HTTP الموثوقة الحاملة للهوية (على سبيل المثال مصادقة trusted proxy أو `gateway.auth.mode="none"`) القيمة `x-openclaw-scopes` عند وجودها، وإلا فإنها ترجع إلى مجموعة نطاقات المشغّل الافتراضية العادية.
- إذا كانت سياسة الوكيل المستهدف تسمح بأدوات حساسة، فيمكن لهذه النقطة استخدامها.
- أبقِ هذه النقطة على loopback/tailnet/private ingress فقط؛ ولا تكشفها مباشرة إلى الإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + ‏`Authorization: Bearer ...`
  - يثبت حيازة سر مشغّل gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    ‏`operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - يتعامل مع أدوار الدردشة على هذه النقطة على أنها أدوار مرسل مالك
- أوضاع HTTP الموثوقة الحاملة للهوية (على سبيل المثال مصادقة trusted proxy، أو `gateway.auth.mode="none"` على private ingress)
  - تصادق بعض الهوية الخارجية الموثوقة أو حدود النشر
  - تحترم `x-openclaw-scopes` عندما يكون الرأس موجودًا
  - ترجع إلى مجموعة نطاقات المشغّل الافتراضية العادية عند غياب الرأس
  - لا تفقد دلالات المالك إلا عندما يضيّق المتصل النطاقات صراحةً ويحذف `operator.admin`

راجع [الأمان](/ar/gateway/security) و[الوصول البعيد](/ar/gateway/remote).

## عقد النموذج الموجّه للوكلاء

يتعامل OpenClaw مع الحقل `model` في OpenAI على أنه **هدف وكيل**، وليس معرّف نموذج موفر خام.

- `model: "openclaw"` يوجّه إلى الوكيل الافتراضي المضبوط.
- `model: "openclaw/default"` يوجّه أيضًا إلى الوكيل الافتراضي المضبوط.
- `model: "openclaw/<agentId>"` يوجّه إلى وكيل محدد.

رؤوس الطلب الاختيارية:

- `x-openclaw-model: <provider/model-or-bare-id>` يتجاوز نموذج الواجهة الخلفية للوكيل المحدد.
- لا يزال `x-openclaw-agent-id: <agentId>` مدعومًا كتجاوز توافق.
- `x-openclaw-session-key: <sessionKey>` يتحكم بالكامل في توجيه الجلسة.
- `x-openclaw-message-channel: <channel>` يضبط سياق قناة دخول اصطناعية للموجّهات والسياسات الواعية بالقناة.

لا تزال أسماء التوافق المستعارة مقبولة:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## تمكين نقطة النهاية

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

افتراضيًا، تكون نقطة النهاية **بلا حالة لكل طلب** (يتم إنشاء مفتاح جلسة جديد مع كل استدعاء).

إذا تضمّن الطلب سلسلة OpenAI ‏`user`، فإن Gateway تشتق مفتاح جلسة مستقرًا منها، بحيث يمكن للاستدعاءات المتكررة مشاركة جلسة وكيل.

## لماذا يهم هذا السطح

هذه هي مجموعة التوافق الأعلى أثرًا لواجهات المستخدم والأدوات المستضافة ذاتيًا:

- تتوقع معظم إعدادات Open WebUI وLobeChat وLibreChat وجود `/v1/models`.
- تتوقع العديد من أنظمة RAG وجود `/v1/embeddings`.
- يمكن لعملاء دردشة OpenAI الحاليين عادةً البدء باستخدام `/v1/chat/completions`.
- يفضّل العملاء الأصليون للوكلاء بشكل متزايد `/v1/responses`.

## قائمة النماذج وتوجيه الوكلاء

<AccordionGroup>
  <Accordion title="ماذا تعيد `/v1/models`؟">
    قائمة أهداف وكلاء OpenClaw.

    تكون المعرّفات المعادة هي `openclaw` و`openclaw/default` وإدخالات `openclaw/<agentId>`.
    استخدمها مباشرةً كقيم OpenAI للحقل `model`.

  </Accordion>
  <Accordion title="هل تسرد `/v1/models` الوكلاء أم الوكلاء الفرعيين؟">
    إنها تسرد أهداف الوكلاء على المستوى الأعلى، وليس نماذج موفري الخلفية ولا الوكلاء الفرعيين.

    يظل الوكلاء الفرعيون طوبولوجيا تنفيذ داخلية. ولا يظهرون كنماذج زائفة.

  </Accordion>
  <Accordion title="لماذا يتم تضمين `openclaw/default`؟">
    `openclaw/default` هو الاسم المستعار المستقر للوكيل الافتراضي المضبوط.

    وهذا يعني أن العملاء يمكنهم الاستمرار في استخدام معرّف متوقع واحد حتى إذا تغير معرّف الوكيل الافتراضي الحقيقي بين البيئات.

  </Accordion>
  <Accordion title="كيف أتجاوز نموذج الواجهة الخلفية؟">
    استخدم `x-openclaw-model`.

    أمثلة:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    إذا حذفته، فسيعمل الوكيل المحدد باستخدام اختيار النموذج العادي المضبوط له.

  </Accordion>
  <Accordion title="كيف تتوافق embeddings مع هذا العقد؟">
    يستخدم `/v1/embeddings` معرّفات `model` نفسها الموجهة للوكلاء.

    استخدم `model: "openclaw/default"` أو `model: "openclaw/<agentId>"`.
    وعندما تحتاج إلى نموذج embedding محدد، أرسله في `x-openclaw-model`.
    ومن دون ذلك الرأس، يمر الطلب إلى إعداد embedding العادي للوكيل المحدد.

  </Accordion>
</AccordionGroup>

## البث (SSE)

اضبط `stream: true` لاستقبال Server-Sent Events ‏(SSE):

- `Content-Type: text/event-stream`
- يكون كل سطر حدث بالشكل `data: <json>`
- ينتهي التدفق بـ `data: [DONE]`

## إعداد سريع لـ Open WebUI

لإجراء اتصال أساسي مع Open WebUI:

- عنوان URL الأساسي: ‏`http://127.0.0.1:18789/v1`
- عنوان URL الأساسي لـ Docker على macOS: ‏`http://host.docker.internal:18789/v1`
- مفتاح API: رمز bearer الخاص بـ Gateway
- النموذج: ‏`openclaw/default`

السلوك المتوقع:

- يجب أن يسرد `GET /v1/models` القيمة `openclaw/default`
- يجب أن يستخدم Open WebUI القيمة `openclaw/default` بوصفها معرّف نموذج الدردشة
- إذا كنت تريد موفر/نموذج خلفية محددًا لذلك الوكيل، فاضبط النموذج الافتراضي العادي للوكيل أو أرسل `x-openclaw-model`

اختبار سريع:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

إذا أعاد ذلك `openclaw/default`، فستتمكن معظم إعدادات Open WebUI من الاتصال باستخدام عنوان URL الأساسي نفسه والرمز نفسه.

## أمثلة

من دون بث:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

مع البث:

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

إدراج النماذج:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

جلب نموذج واحد:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

إنشاء embeddings:

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

- تعيد `/v1/models` أهداف وكلاء OpenClaw، وليس كتالوجات الموفّرين الخام.
- تكون `openclaw/default` موجودة دائمًا بحيث يعمل معرّف مستقر واحد عبر البيئات.
- يجب أن توضع تجاوزات موفر/نموذج الواجهة الخلفية في `x-openclaw-model`، وليس في الحقل `model` الخاص بـ OpenAI.
- يدعم `/v1/embeddings` الحقل `input` كسلسلة أو مصفوفة من السلاسل.

## ذو صلة

- [مرجع الإعدادات](/ar/gateway/configuration-reference)
- [OpenAI](/ar/providers/openai)
