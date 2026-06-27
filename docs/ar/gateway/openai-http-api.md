---
read_when:
    - دمج الأدوات التي تتوقع OpenAI Chat Completions
summary: وفّر نقطة نهاية HTTP متوافقة مع OpenAI على ‎/v1/chat/completions‎ من Gateway
title: إكمالات الدردشة من OpenAI
x-i18n:
    generated_at: "2026-06-27T17:41:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

يمكن لـ Gateway في OpenClaw تقديم نقطة نهاية صغيرة متوافقة مع OpenAI لإكمالات الدردشة.

نقطة النهاية هذه **معطلة افتراضيًا**. فعّلها في الإعدادات أولًا.

- `POST /v1/chat/completions`
- المنفذ نفسه مثل Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

عند تفعيل سطح HTTP المتوافق مع OpenAI في Gateway، فإنه يقدّم أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

داخليًا، تُنفَّذ الطلبات كتشغيل عادي لوكيل Gateway (مسار الكود نفسه مثل `openclaw agent`)، لذلك تتطابق التوجيهات/الأذونات/الإعدادات مع Gateway لديك.

## المصادقة

تستخدم إعدادات مصادقة Gateway.

مسارات مصادقة HTTP الشائعة:

- مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`):
  `Authorization: Bearer <token-or-password>`
- مصادقة HTTP الموثوقة الحاملة للهوية (`gateway.auth.mode="trusted-proxy"`):
  وجّه عبر الوكيل المهيأ والواعي بالهوية ودعه يحقن
  ترويسات الهوية المطلوبة
- مصادقة مفتوحة لدخول خاص (`gateway.auth.mode="none"`):
  لا يلزم وجود ترويسة مصادقة

ملاحظات:

- عند استخدام `gateway.auth.mode="token"`، استخدم `gateway.auth.token` (أو `OPENCLAW_GATEWAY_TOKEN`).
- عند استخدام `gateway.auth.mode="password"`، استخدم `gateway.auth.password` (أو `OPENCLAW_GATEWAY_PASSWORD`).
- عند استخدام `gateway.auth.mode="trusted-proxy"`، يجب أن يأتي طلب HTTP من
  مصدر وكيل موثوق مهيأ؛ وتتطلب وكلاء local loopback على المضيف نفسه ضبطًا صريحًا:
  `gateway.auth.trustedProxy.allowLoopback = true`.
- يمكن للمتصلين الداخليين على المضيف نفسه الذين يتجاوزون الوكيل استخدام
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` كخيار رجوع محلي مباشر.
  أي دليل في ترويسة `Forwarded` أو `X-Forwarded-*` أو `X-Real-IP`
  يُبقي الطلب على مسار الوكيل الموثوق بدلًا من ذلك.
- إذا كانت `gateway.auth.rateLimit` مهيأة وحدث عدد كبير جدًا من إخفاقات المصادقة، فترجع نقطة النهاية `429` مع `Retry-After`.

## حد الأمان (مهم)

تعامل مع نقطة النهاية هذه كسطح **وصول كامل للمشغّل** لمثيل Gateway.

- مصادقة HTTP bearer هنا ليست نموذج نطاق ضيق لكل مستخدم.
- يجب التعامل مع رمز/كلمة مرور Gateway صالحة لنقطة النهاية هذه كاعتماد مالك/مشغّل.
- تمر الطلبات عبر مسار وكيل مستوى التحكم نفسه مثل إجراءات المشغّل الموثوق.
- لا يوجد حد أدوات منفصل لغير المالك/لكل مستخدم على نقطة النهاية هذه؛ بمجرد أن يجتاز المتصل مصادقة Gateway هنا، يعامل OpenClaw ذلك المتصل كمشغّل موثوق لهذا Gateway.
- في أوضاع مصادقة السر المشترك (`token` و `password`)، تستعيد نقطة النهاية الإعدادات الافتراضية الكاملة العادية للمشغّل حتى لو أرسل المتصل ترويسة `x-openclaw-scopes` أضيق.
- تحترم أوضاع HTTP الحاملة لهوية موثوقة (مثل مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"`) ترويسة `x-openclaw-scopes` عند وجودها، وإلا فتعود إلى مجموعة النطاقات الافتراضية العادية للمشغّل.
- إذا كانت سياسة الوكيل الهدف تسمح بأدوات حساسة، يمكن لنقطة النهاية هذه استخدامها.
- أبقِ نقطة النهاية هذه على loopback/tailnet/دخول خاص فقط؛ لا تعرضها مباشرة للإنترنت العام.

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر مشغّل Gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغّل الافتراضية الكاملة:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - يعامل أدوار الدردشة على نقطة النهاية هذه كأدوار مرسلة من المالك
- أوضاع HTTP الحاملة لهوية موثوقة (مثل مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على دخول خاص)
  - تصادق هوية موثوقة خارجية أو حد نشر ما
  - تحترم `x-openclaw-scopes` عند وجود الترويسة
  - تعود إلى مجموعة نطاقات المشغّل الافتراضية العادية عند غياب الترويسة
  - تفقد دلالات المالك فقط عندما يضيّق المتصل النطاقات صراحة ويحذف `operator.admin`
  - تتطلب `operator.admin` لعناصر تحكم الطلب على مستوى المالك مثل `x-openclaw-model`

راجع [الأمان](/ar/gateway/security) و[الوصول عن بُعد](/ar/gateway/remote).

## متى تستخدم نقطة النهاية هذه

استخدم `/v1/chat/completions` عندما تدمج أدوات أو خلفية تطبيق موثوقة مع Gateway موجود ويمكنها الاحتفاظ باعتمادات مشغّل Gateway بأمان.

- فضّل هذا بدلًا من إضافة قناة مدمجة جديدة عندما يكون التكامل مجرد سطح مشغّل/عميل آخر لـ Gateway نفسه.
- بالنسبة لعملاء الهواتف المحمولة الأصليين الذين يتصلون مباشرة بـ Gateway بعيد، فضّل [WebChat](/ar/web/webchat) أو [بروتوكول Gateway](/ar/gateway/protocol)، ونفّذ تدفق تمهيد الجهاز المقترن/رمز الجهاز حتى لا يحتاج الجهاز إلى رمز/كلمة مرور HTTP مشتركة.
- ابنِ Plugin قناة بدلًا من ذلك عندما تدمج شبكة مراسلة خارجية لها مستخدموها أو غرفها أو تسليم Webhook أو نقل صادر خاص بها. راجع [بناء Plugins](/ar/plugins/building-plugins).

## عقد نموذج يضع الوكيل أولًا

يعامل OpenClaw حقل OpenAI `model` كـ **هدف وكيل**، وليس كمعرّف نموذج مزود خام.

- يوجّه `model: "openclaw"` إلى الوكيل الافتراضي المهيأ.
- يوجّه `model: "openclaw/default"` أيضًا إلى الوكيل الافتراضي المهيأ.
- يوجّه `model: "openclaw/<agentId>"` إلى وكيل محدد.

ترويسات الطلب الاختيارية:

- يتجاوز `x-openclaw-model: <provider/model-or-bare-id>` نموذج الخلفية للوكيل المحدد. يمكن لمتصلي bearer بالسر المشترك استخدام هذه الترويسة. يحتاج المتصلون الحاملون للهوية، مثل طلبات الوكيل الموثوق أو الدخول الخاص بلا مصادقة مع `x-openclaw-scopes`، إلى `operator.admin`؛ ويتلقى المتصلون ذوو إذن الكتابة فقط `403 missing scope: operator.admin`.
- يبقى `x-openclaw-agent-id: <agentId>` مدعومًا كتجاوز توافق.
- يتحكم `x-openclaw-session-key: <sessionKey>` صراحة في توجيه الجلسة. يجب ألا تستخدم القيمة مساحات أسماء جلسات داخلية محجوزة مثل `subagent:` أو `cron:` أو `acp:`؛ تُرفض تلك الطلبات مع `400 invalid_request_error`.
- يضبط `x-openclaw-message-channel: <channel>` سياق قناة الدخول الاصطناعية للمطالبات والسياسات الواعية بالقناة.

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

افتراضيًا تكون نقطة النهاية **عديمة الحالة لكل طلب** (يُنشأ مفتاح جلسة جديد في كل استدعاء).

إذا تضمّن الطلب سلسلة OpenAI `user`، يشتق Gateway مفتاح جلسة ثابتًا منها، وبذلك يمكن للاستدعاءات المتكررة مشاركة جلسة وكيل.

بالنسبة للتطبيقات المخصصة، فالافتراضي الأكثر أمانًا هو إعادة استخدام قيمة `user` نفسها لكل سلسلة محادثة. تجنّب معرّفات مستوى الحساب إلا إذا كنت تريد صراحة أن تشارك محادثات أو أجهزة متعددة جلسة OpenClaw واحدة. استخدم `x-openclaw-session-key` فقط عندما تحتاج إلى تحكم صريح في التوجيه عبر عدة عملاء أو سلاسل، واختر مفاتيح مملوكة للتطبيق لا تبدأ بمساحات أسماء داخلية محجوزة مثل `subagent:` أو `cron:` أو `acp:`.

## لماذا هذا السطح مهم

هذه أعلى مجموعة توافق ذات أثر للواجهات الأمامية والأدوات المستضافة ذاتيًا:

- تتوقع معظم إعدادات Open WebUI وLobeChat وLibreChat وجود `/v1/models`.
- تتوقع كثير من أنظمة RAG وجود `/v1/embeddings`.
- يستطيع عملاء دردشة OpenAI الحاليون عادة البدء بـ `/v1/chat/completions`.
- يفضّل العملاء الأكثر قربًا من الوكلاء بشكل متزايد `/v1/responses`.

## قائمة النماذج وتوجيه الوكيل

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    قائمة أهداف وكلاء OpenClaw.

    المعرّفات المُرجعة هي إدخالات `openclaw` و`openclaw/default` و`openclaw/<agentId>`.
    استخدمها مباشرة كقيم OpenAI `model`.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    يسرد أهداف الوكلاء على المستوى الأعلى، وليس نماذج مزودي الخلفية ولا الوكلاء الفرعيين.

    تبقى الوكلاء الفرعيون ضمن طوبولوجيا التنفيذ الداخلية. ولا تظهر كنماذج صورية.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` هو الاسم المستعار الثابت للوكيل الافتراضي المهيأ.

    يعني ذلك أن العملاء يمكنهم الاستمرار في استخدام معرّف واحد يمكن التنبؤ به حتى إذا تغيّر معرّف الوكيل الافتراضي الحقيقي بين البيئات.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    استخدم `x-openclaw-model`. هذا تجاوز على مستوى المالك: يعمل مع مسار رمز/كلمة مرور bearer بالسر المشترك لـ Gateway، ويتطلب `operator.admin` على مسارات HTTP الحاملة للهوية مثل مصادقة الوكيل الموثوق.

    أمثلة:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    إذا حذفته، يعمل الوكيل المحدد بخيار النموذج العادي المهيأ له.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    يستخدم `/v1/embeddings` معرّفات `model` نفسها لأهداف الوكلاء.

    استخدم `model: "openclaw/default"` أو `model: "openclaw/<agentId>"`.
    عندما تحتاج إلى نموذج تضمين محدد، أرسله في `x-openclaw-model` من متصل بالسر المشترك أو متصل حامل للهوية مع `operator.admin`.
    بدون تلك الترويسة، يمر الطلب إلى إعداد التضمين العادي للوكيل المحدد.

  </Accordion>
</AccordionGroup>

## البث (SSE)

اضبط `stream: true` لتلقي الأحداث المرسلة من الخادم (SSE):

- `Content-Type: text/event-stream`
- كل سطر حدث هو `data: <json>`
- ينتهي البث بـ `data: [DONE]`

## عقد أدوات الدردشة

يدعم `/v1/chat/completions` مجموعة فرعية من أدوات الدوال متوافقة مع عملاء دردشة OpenAI الشائعين.

### حقول الطلب المدعومة

- `tools`: مصفوفة من `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"` أو `"none"` أو `"required"` أو `{ "type": "function", "function": { "name": "..." } }`
- أدوار متابعة `messages[*].role: "tool"`
- `messages[*].tool_call_id` لربط نتائج الأدوات باستدعاء أداة سابق
- `max_completion_tokens`: رقم؛ حد لكل استدعاء لإجمالي رموز الإكمال (بما في ذلك رموز الاستدلال). اسم حقل OpenAI Chat Completions الحالي؛ وهو المفضل عند إرسال كل من `max_completion_tokens` و`max_tokens`.
- `max_tokens`: رقم؛ اسم مستعار قديم مقبول للتوافق مع الإصدارات السابقة. يتم تجاهله عند وجود `max_completion_tokens` أيضًا.
- `temperature`: رقم؛ درجة حرارة أخذ عينات بأفضل جهد تُمرر إلى المزود العلوي عبر قناة معاملات بث الوكيل.
- `top_p`: رقم؛ أخذ عينات نووية بأفضل جهد يُمرر إلى المزود العلوي عبر قناة معاملات بث الوكيل.
- `frequency_penalty`: رقم؛ عقوبة تكرار بأفضل جهد تُمرر إلى المزود العلوي عبر قناة معاملات بث الوكيل. النطاق المتحقق منه: -2.0 إلى 2.0. ترجع `400 invalid_request_error` للقيم خارج النطاق.
- `presence_penalty`: رقم؛ عقوبة حضور بأفضل جهد تُمرر إلى المزود العلوي عبر قناة معاملات بث الوكيل. النطاق المتحقق منه: -2.0 إلى 2.0. ترجع `400 invalid_request_error` للقيم خارج النطاق.
- `seed`: رقم (عدد صحيح)؛ بذرة بأفضل جهد تُمرر إلى المزود العلوي عبر قناة معاملات بث الوكيل. ترجع `400 invalid_request_error` للقيم غير الصحيحة.
- `stop`: سلسلة أو مصفوفة تصل إلى 4 سلاسل؛ تسلسلات إيقاف بأفضل جهد تُمرر إلى المزود العلوي عبر قناة معاملات بث الوكيل. ترجع `400 invalid_request_error` لأكثر من 4 تسلسلات أو لإدخالات غير نصية/فارغة.

عند ضبط أيٍّ من حقلي حدّ الرموز، تُمرَّر القيمة إلى المزوّد upstream عبر قناة معلمات البث الخاصة بالوكيل. يختار نقل المزوّد اسم حقل السلك الفعلي المُرسل إلى المزوّد upstream: `max_completion_tokens` لنقاط نهاية عائلة OpenAI، و`max_tokens` للمزوّدين الذين لا يقبلون إلا الاسم القديم (مثل Mistral وChutes). تتبع حقول أخذ العينات (`temperature`، `top_p`، `frequency_penalty`، `presence_penalty`، `seed`) قناة معلمات البث نفسها؛ أما واجهة Codex Responses الخلفية المستندة إلى ChatGPT فتزيلها من جهة الخادم لأنها تستخدم أخذ عينات ثابتًا. ينتقل `stop` أيضًا عبر قناة معلمات البث ويُطابق حقل الإيقاف في النقل (`stop` لواجهات Chat Completions الخلفية، و`stop_sequences` لـ Anthropic)؛ ولا تحتوي OpenAI Responses API على معلمة إيقاف، لذلك لا يُطبَّق `stop` على النماذج المدعومة بواجهة Responses.

### المتغيرات غير المدعومة

تعيد نقطة النهاية `400 invalid_request_error` للمتغيرات غير المدعومة للأدوات، بما في ذلك:

- `tools` غير المصفوفية
- إدخالات أدوات ليست دوال
- غياب `tool.function.name`
- متغيرات `tool_choice` مثل `allowed_tools` و`custom`
- قيم `tool_choice.function.name` التي لا تطابق `tools` المقدمة

بالنسبة إلى `tool_choice: "required"` و`tool_choice` المثبتة على دالة، تضيّق نقطة النهاية مجموعة أدوات الدوال العميلة المكشوفة، وتوجّه وقت التشغيل إلى استدعاء أداة عميل قبل الاستجابة، وتعيد خطأ إذا لم تتضمن استجابة الوكيل استدعاء أداة عميل منظمًا مطابقًا. ينطبق هذا العقد على قائمة HTTP `tools` المقدمة من المستدعي، وليس على كل أداة وكيل داخلية في OpenClaw.

### شكل استجابة الأدوات غير المتدفقة

عندما يقرر الوكيل استدعاء الأدوات، تستخدم الاستجابة:

- إدخالات `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` مع:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (سلسلة JSON)

تُعاد تعليقات المساعد قبل استدعاء الأداة في `choices[0].message.content` (وقد تكون فارغة).

### شكل استجابة الأدوات المتدفقة

عندما تكون `stream: true`، تُصدَر استدعاءات الأدوات على هيئة أجزاء SSE تزايدية:

- دلتا أولية لدور المساعد
- دلتا اختيارية لتعليقات المساعد
- جزء واحد أو أكثر من `delta.tool_calls` يحمل هوية الأداة وأجزاء الوسائط
- جزء نهائي مع `finish_reason: "tool_calls"`
- `data: [DONE]`

إذا كانت `stream_options.include_usage=true`، يُصدر جزء استخدام لاحق قبل `[DONE]`.

### حلقة متابعة الأدوات

بعد تلقي `tool_calls`، ينبغي للعميل تنفيذ الدالة أو الدوال المطلوبة وإرسال طلب متابعة يتضمن:

- رسالة استدعاء الأداة السابقة من المساعد
- رسالة واحدة أو أكثر بدور `role: "tool"` مع `tool_call_id` مطابق

يتيح هذا لتشغيل وكيل Gateway متابعة حلقة الاستدلال نفسها وإنتاج إجابة المساعد النهائية.

## إعداد Open WebUI سريع

لاتصال Open WebUI أساسي:

- عنوان URL الأساسي: `http://127.0.0.1:18789/v1`
- عنوان URL الأساسي لـ Docker على macOS: `http://host.docker.internal:18789/v1`
- مفتاح API: رمز bearer الخاص بـ Gateway لديك
- النموذج: `openclaw/default`

السلوك المتوقع:

- يجب أن يسرد `GET /v1/models` القيمة `openclaw/default`
- يجب أن يستخدم Open WebUI القيمة `openclaw/default` كمعرّف نموذج الدردشة
- إذا أردت مزوّدًا/نموذجًا خلفيًا محددًا لذلك الوكيل، فاضبط النموذج الافتراضي العادي للوكيل أو أرسل `x-openclaw-model` من مستدعٍ ذي سر مشترك أو مستدعٍ يحمل هوية مع `operator.admin`

اختبار دخان سريع:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

إذا أعاد ذلك `openclaw/default`، فيمكن لمعظم إعدادات Open WebUI الاتصال باستخدام عنوان URL الأساسي والرمز نفسيهما.

## أمثلة

جلسة مستقرة لمحادثة تطبيق واحدة:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "user": "conv:YOUR_CONVERSATION_ID",
    "messages": [{"role":"user","content":"Summarize my tasks for today"}]
  }'
```

أعد استخدام قيمة `user` نفسها في الاستدعاءات اللاحقة لتلك المحادثة لمتابعة جلسة الوكيل نفسها.

غير متدفق:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

متدفق:

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

- يعيد `/v1/models` أهداف وكلاء OpenClaw، وليس كتالوجات المزوّد الخام.
- يكون `openclaw/default` حاضرًا دائمًا بحيث يعمل معرّف ثابت واحد عبر البيئات.
- تنتمي تجاوزات المزوّد/النموذج الخلفية إلى `x-openclaw-model`، وليس إلى حقل OpenAI `model`. في مسارات مصادقة HTTP الحاملة للهوية، يتطلب هذا الرأس `operator.admin`.
- يدعم `/v1/embeddings` قيمة `input` كسلسلة أو مصفوفة سلاسل.

## ذو صلة

- [مرجع التهيئة](/ar/gateway/configuration-reference)
- [OpenAI](/ar/providers/openai)
