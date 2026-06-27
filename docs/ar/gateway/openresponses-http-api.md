---
read_when:
    - دمج العملاء الذين يتعاملون مع واجهة برمجة تطبيقات OpenResponses
    - تريد مدخلات قائمة على العناصر، أو استدعاءات أدوات العميل، أو أحداث SSE
summary: اعرض نقطة نهاية HTTP متوافقة مع OpenResponses على المسار /v1/responses من Gateway
title: واجهة برمجة تطبيقات OpenResponses
x-i18n:
    generated_at: "2026-06-27T17:42:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

تستطيع Gateway الخاصة بـ OpenClaw تقديم نقطة نهاية `POST /v1/responses` متوافقة مع OpenResponses.

نقطة النهاية هذه **معطلة افتراضيا**. فعّلها في الإعداد أولا.

- `POST /v1/responses`
- المنفذ نفسه مثل Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

خلف الكواليس، تنفذ الطلبات كتشغيل عادي لوكيل Gateway (مسار الكود نفسه مثل
`openclaw agent`)، لذلك تتطابق التوجيهات/الأذونات/الإعدادات مع Gateway لديك.

## المصادقة والأمان والتوجيه

يطابق السلوك التشغيلي [إكمالات دردشة OpenAI](/ar/gateway/openai-http-api):

- استخدم مسار مصادقة HTTP المطابق في Gateway:
  - مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`): `Authorization: Bearer <token-or-password>`
  - مصادقة الوكيل الموثوق (`gateway.auth.mode="trusted-proxy"`): ترويسات وكيل مدركة للهوية من مصدر وكيل موثوق مكوّن؛ تتطلب وكلاء local loopback على المضيف نفسه تعيين `gateway.auth.trustedProxy.allowLoopback = true` صراحة
  - الرجوع المحلي المباشر للوكيل الموثوق: يمكن للمتصلين من المضيف نفسه من دون ترويسات `Forwarded` أو `X-Forwarded-*` أو `X-Real-IP` استخدام `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`
  - مصادقة مفتوحة لدخول خاص (`gateway.auth.mode="none"`): لا توجد ترويسة مصادقة
- عامل نقطة النهاية كصلاحية مشغل كاملة لمثيل Gateway
- لأوضاع مصادقة السر المشترك (`token` و`password`)، تجاهل قيم `x-openclaw-scopes` الأضيق المعلنة في حامل الرمز واستعد افتراضيات المشغل الكاملة العادية
- لأوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"`)، احترم `x-openclaw-scopes` عند وجودها، وإلا فارجع إلى مجموعة النطاقات الافتراضية العادية للمشغل
- حدد الوكلاء باستخدام `model: "openclaw"` أو `model: "openclaw/default"` أو `model: "openclaw/<agentId>"` أو `x-openclaw-agent-id`
- استخدم `x-openclaw-model` عندما تريد تجاوز نموذج الخلفية للوكيل المحدد
- استخدم `x-openclaw-session-key` لتوجيه جلسة صريح
- استخدم `x-openclaw-message-channel` عندما تريد سياق قناة دخول اصطناعية غير افتراضية

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر مشغل Gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغل الافتراضية الكاملة:
    `operator.admin`، `operator.approvals`، `operator.pairing`،
    `operator.read`، `operator.talk.secrets`، `operator.write`
  - يعامل أدوار الدردشة في نقطة النهاية هذه كأدوار مرسلة من المالك
- أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على دخول خاص)
  - تحترم `x-openclaw-scopes` عندما تكون الترويسة موجودة
  - تعود إلى مجموعة نطاقات المشغل الافتراضية العادية عندما تكون الترويسة غائبة
  - لا تفقد دلالات المالك إلا عندما يضيّق المتصل النطاقات صراحة ويحذف `operator.admin`

فعّل نقطة النهاية هذه أو عطّلها باستخدام `gateway.http.endpoints.responses.enabled`.

يشمل سطح التوافق نفسه أيضا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

للحصول على الشرح القانوني لكيفية ترابط نماذج استهداف الوكلاء و`openclaw/default` وتمرير التضمينات وتجاوزات نموذج الخلفية، راجع [إكمالات دردشة OpenAI](/ar/gateway/openai-http-api#agent-first-model-contract) و[قائمة النماذج وتوجيه الوكلاء](/ar/gateway/openai-http-api#model-list-and-agent-routing).

## سلوك الجلسة

افتراضيا تكون نقطة النهاية **عديمة الحالة لكل طلب** (ينشأ مفتاح جلسة جديد في كل استدعاء).

إذا تضمّن الطلب سلسلة OpenResponses `user`، تشتق Gateway مفتاح جلسة ثابتًا
منها، لذلك يمكن للاستدعاءات المتكررة مشاركة جلسة وكيل.

## شكل الطلب (مدعوم)

يتبع الطلب واجهة OpenResponses API مع إدخال قائم على العناصر. الدعم الحالي:

- `input`: سلسلة أو مصفوفة من كائنات العناصر.
- `instructions`: تدمج في موجه النظام.
- `tools`: تعريفات أدوات العميل (أدوات الدوال).
- `tool_choice`: `"auto"` أو `"none"` أو `"required"` أو `{ "type": "function", "name": "..." }` لتصفية أدوات العميل أو طلبها.
- `stream`: يفعل بث SSE.
- `max_output_tokens`: حد إخراج بأفضل جهد (يعتمد على المزوّد).
- `temperature`: درجة حرارة أخذ العينات بأفضل جهد، تمرر إلى المزوّد. تتجاهلها خلفية Codex Responses المستندة إلى ChatGPT، والتي تستخدم أخذ عينات ثابتًا من جهة الخادم.
- `top_p`: أخذ عينات نواتي بأفضل جهد، يمرر إلى المزوّد. ينطبق تحذير Codex Responses نفسه كما في `temperature`.
- `user`: توجيه جلسة ثابت.

مقبول لكن **متجاهل حاليا**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

مدعوم:

- `previous_response_id`: يعيد OpenClaw استخدام جلسة الاستجابة السابقة عندما يبقى الطلب ضمن نطاق الوكيل/المستخدم/الجلسة المطلوبة نفسه.

## العناصر (الإدخال)

### `message`

الأدوار: `system`، `developer`، `user`، `assistant`.

- يضاف `system` و`developer` إلى موجه النظام.
- يصبح أحدث عنصر `user` أو `function_call_output` هو "الرسالة الحالية".
- تدرج رسائل المستخدم/المساعد السابقة كسجل للسياق.

### `function_call_output` (أدوات قائمة على الدور)

أرسل نتائج الأدوات مرة أخرى إلى النموذج:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` و`item_reference`

مقبولان لتوافق المخطط لكن يتم تجاهلهما عند بناء الموجه.

## الأدوات (أدوات دوال من جانب العميل)

قدّم الأدوات باستخدام `tools: [{ type: "function", name, description?, parameters? }]`.

إذا قرر الوكيل استدعاء أداة، ترجع الاستجابة عنصر إخراج `function_call`.
ثم ترسل طلب متابعة مع `function_call_output` لمتابعة الدور.

بالنسبة إلى `tool_choice: "required"` و`tool_choice` المثبت على دالة، تضيّق نقطة النهاية مجموعة أدوات الدوال العميلة المعروضة، وتوجّه وقت التشغيل لاستدعاء أداة عميل قبل الاستجابة، وترفض الدور إذا لم يتضمن استدعاء أداة عميل منظما مطابقا. ينطبق هذا العقد على قائمة HTTP `tools` التي يوفّرها المتصل، وليس على كل أداة وكيل داخلية في OpenClaw. ترجع الطلبات غير المتدفقة `502` مع `api_error`؛ وتصدر الطلبات المتدفقة حدث `response.failed`. يطابق هذا عقد `/v1/chat/completions`.

## الصور (`input_image`)

يدعم مصادر base64 أو URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

أنواع MIME المسموح بها (حاليا): `image/jpeg`، `image/png`، `image/gif`، `image/webp`، `image/heic`، `image/heif`.
الحجم الأقصى (حاليا): 10MB.

## الملفات (`input_file`)

يدعم مصادر base64 أو URL:

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

أنواع MIME المسموح بها (حاليا): `text/plain`، `text/markdown`، `text/html`، `text/csv`،
`application/json`، `application/pdf`.

الحجم الأقصى (حاليا): 5MB.

السلوك الحالي:

- يفك ترميز محتوى الملف ويضاف إلى **موجه النظام**، وليس رسالة المستخدم،
  لذلك يبقى مؤقتا (لا يستمر في سجل الجلسة).
- يغلّف نص الملف المفكوك كـ **محتوى خارجي غير موثوق** قبل إضافته،
  لذلك تعامل بايتات الملف كبيانات، لا كتعليمات موثوقة.
- تستخدم الكتلة المحقونة علامات حدود صريحة مثل
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر بيانات وصفية
  `Source: External`.
- يحذف مسار إدخال الملفات هذا عمدا لافتة `SECURITY NOTICE:` الطويلة
  للحفاظ على ميزانية الموجه؛ وتظل علامات الحدود والبيانات الوصفية في مكانها.
- تحلل ملفات PDF كنص أولا. إذا عثر على نص قليل، تحول الصفحات الأولى
  إلى صور نقطية وتمرر إلى النموذج، وتستخدم كتلة الملف المحقونة
  العنصر النائب `[PDF content rendered to images]`.

يوفّر Plugin `document-extract` المضمن تحليل PDF، ويستخدم
`clawpdf` وبيئة تشغيل PDFium WebAssembly المعبأة الخاصة به لاستخراج النص
وعرض الصفحات.

افتراضيات جلب URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (إجمالي أجزاء `input_file` + `input_image` المستندة إلى URL لكل طلب)
- الطلبات محروسة (تحليل DNS، حظر عناوين IP الخاصة، حدود إعادة التوجيه، المهل).
- تدعم قوائم السماح الاختيارية لأسماء المضيفين لكل نوع إدخال (`files.urlAllowlist`، `images.urlAllowlist`).
  - المضيف المطابق: `"cdn.example.com"`
  - نطاقات فرعية بحرف بدل: `"*.assets.example.com"` (لا يطابق الجذر)
  - تعني قوائم السماح الفارغة أو المحذوفة عدم وجود قيد قائمة سماح لأسماء المضيفين.
- لتعطيل عمليات الجلب المستندة إلى URL بالكامل، اضبط `files.allowUrl: false` و/أو `images.allowUrl: false`.

## حدود الملفات + الصور (الإعداد)

يمكن ضبط الافتراضيات ضمن `gateway.http.endpoints.responses`:

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/heic",
              "image/heif",
            ],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

الافتراضيات عند الحذف:

- `maxBodyBytes`: 20MB
- `maxUrlParts`: 8
- `files.maxBytes`: 5MB
- `files.maxChars`: 200k
- `files.maxRedirects`: 3
- `files.timeoutMs`: 10s
- `files.pdf.maxPages`: 4
- `files.pdf.maxPixels`: 4,000,000
- `files.pdf.minTextChars`: 200
- `images.maxBytes`: 10MB
- `images.maxRedirects`: 3
- `images.timeoutMs`: 10s
- تقبل مصادر HEIC/HEIF `input_image` عندما يكون محول نظام متاحا وتطبع إلى JPEG قبل تسليمها إلى المزوّد. المحولات المدعومة هي `sips` في macOS أو ImageMagick أو GraphicsMagick أو ffmpeg.

ملاحظة أمنية:

- تطبق قوائم سماح URL قبل الجلب وعلى قفزات إعادة التوجيه.
- لا يتجاوز السماح باسم مضيف حظر عناوين IP الخاصة/الداخلية.
- بالنسبة إلى بوابات Gateway المعرضة للإنترنت، طبّق ضوابط خروج الشبكة إضافة إلى حراس مستوى التطبيق.
  راجع [الأمان](/ar/gateway/security).

## البث (SSE)

عيّن `stream: true` لتلقي أحداث مرسلة من الخادم (SSE):

- `Content-Type: text/event-stream`
- كل سطر حدث هو `event: <type>` و`data: <json>`
- ينتهي الدفق بـ `data: [DONE]`

أنواع الأحداث الصادرة حاليا:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (عند الخطأ)

## الاستخدام

تعبأ `usage` عندما يبلغ المزوّد الأساسي عن أعداد الرموز.
يطبع OpenClaw الأسماء المستعارة الشائعة بأسلوب OpenAI قبل أن تصل تلك العدادات
إلى أسطح الحالة/الجلسة اللاحقة، بما في ذلك `input_tokens` / `output_tokens`
و`prompt_tokens` / `completion_tokens`.

## الأخطاء

تستخدم الأخطاء كائن JSON مثل:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

الحالات الشائعة:

- `401` مصادقة مفقودة/غير صالحة
- `400` جسم طلب غير صالح
- `405` طريقة خاطئة

## أمثلة

غير متدفق:

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

متدفق:

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```

## ذات صلة

- [إكمالات محادثة OpenAI](/ar/gateway/openai-http-api)
- [OpenAI](/ar/providers/openai)
