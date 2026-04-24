---
read_when:
    - تكامل العملاء الذين يتحدثون واجهة OpenResponses API
    - أنت تريد مدخلات قائمة على العناصر، أو استدعاءات أدوات من العميل، أو أحداث SSE
summary: كشف نقطة نهاية HTTP متوافقة مع OpenResponses عند `/v1/responses` من خلال Gateway
title: واجهة OpenResponses API
x-i18n:
    generated_at: "2026-04-24T07:42:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73f2e075b78e5153633af17c3f59cace4516e5aaa88952d643cfafb9d0df8022
    source_path: gateway/openresponses-http-api.md
    workflow: 15
---

# OpenResponses API (HTTP)

يمكن لـ Gateway في OpenClaw تقديم نقطة نهاية `POST /v1/responses` متوافقة مع OpenResponses.

تكون نقطة النهاية هذه **معطلة افتراضيًا**. فعّلها أولًا في الإعداد.

- `POST /v1/responses`
- المنفذ نفسه الذي تستخدمه Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

في الخلفية، تُنفَّذ الطلبات كتجربة تشغيل وكيل عادية في Gateway (المسار البرمجي نفسه الذي يستخدمه
`openclaw agent`)، لذا فإن التوجيه/الأذونات/الإعداد تتطابق مع Gateway لديك.

## المصادقة والأمان والتوجيه

يتطابق السلوك التشغيلي مع [OpenAI Chat Completions](/ar/gateway/openai-http-api):

- استخدم مسار مصادقة HTTP الخاص بـ Gateway المطابق:
  - مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`): `Authorization: Bearer <token-or-password>`
  - مصادقة trusted-proxy (`gateway.auth.mode="trusted-proxy"`): رؤوس proxy مدركة للهوية من مصدر trusted proxy غير loopback مُعدّ
  - مصادقة open الخاصة بـ private-ingress (`gateway.auth.mode="none"`): دون رأس مصادقة
- تعامل مع نقطة النهاية على أنها وصول operator كامل إلى نسخة gateway
- بالنسبة إلى أوضاع مصادقة السر المشترك (`token` و`password`)، تجاهل القيم الأضيق المعلنة في bearer ضمن `x-openclaw-scopes` وأعد القيم الافتراضية الكاملة العادية لـ operator
- بالنسبة إلى أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة trusted proxy أو `gateway.auth.mode="none"`)، احترم `x-openclaw-scopes` عند وجوده، وإلا فارجع إلى مجموعة scopes الافتراضية العادية الخاصة بـ operator
- اختر الوكلاء باستخدام `model: "openclaw"`، أو `model: "openclaw/default"`، أو `model: "openclaw/<agentId>"`، أو `x-openclaw-agent-id`
- استخدم `x-openclaw-model` عندما تريد تجاوز النموذج الخلفي للوكيل المحدد
- استخدم `x-openclaw-session-key` لتوجيه الجلسة بشكل صريح
- استخدم `x-openclaw-message-channel` عندما تريد سياق قناة إدخال اصطناعية غير افتراضية

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر operator المشترك الخاص بـ gateway
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يعيد مجموعة scopes الافتراضية الكاملة الخاصة بـ operator:
    `operator.admin` و`operator.approvals` و`operator.pairing`,
    `operator.read` و`operator.talk.secrets` و`operator.write`
  - يتعامل مع أدوار الدردشة في نقطة النهاية هذه على أنها أدوار مرسل-مالك
- أوضاع HTTP الموثوقة الحاملة للهوية (مثل مصادقة trusted proxy، أو `gateway.auth.mode="none"` على private ingress)
  - تحترم `x-openclaw-scopes` عندما يكون الرأس موجودًا
  - تعود إلى مجموعة scopes الافتراضية العادية الخاصة بـ operator عند غياب الرأس
  - لا تفقد دلالات المالك إلا عندما يضيّق المستدعي scopes صراحةً ويحذف `operator.admin`

فعّل أو عطّل نقطة النهاية هذه باستخدام `gateway.http.endpoints.responses.enabled`.

ويتضمن سطح التوافق نفسه أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

للاطلاع على الشرح الرسمي لكيفية توافق النماذج المستهدفة للوكلاء، و`openclaw/default`، والتمرير المباشر لـ embeddings، وتجاوزات النماذج الخلفية معًا، راجع [OpenAI Chat Completions](/ar/gateway/openai-http-api#agent-first-model-contract) و[قائمة النماذج وتوجيه الوكلاء](/ar/gateway/openai-http-api#model-list-and-agent-routing).

## سلوك الجلسة

افتراضيًا، تكون نقطة النهاية **عديمة الحالة لكل طلب** (يتم إنشاء مفتاح جلسة جديد مع كل استدعاء).

إذا تضمن الطلب سلسلة `user` الخاصة بـ OpenResponses، فإن Gateway تشتق مفتاح جلسة ثابتًا
منها، بحيث يمكن للطلبات المتكررة مشاركة جلسة وكيل.

## شكل الطلب (المدعوم)

يتبع الطلب واجهة OpenResponses API مع إدخال قائم على العناصر. الدعم الحالي:

- `input`: سلسلة أو مصفوفة من كائنات العناصر.
- `instructions`: تُدمج في مطالبة النظام.
- `tools`: تعريفات أدوات العميل (أدوات function).
- `tool_choice`: تصفية أدوات العميل أو فرضها.
- `stream`: يفعّل بث SSE.
- `max_output_tokens`: حد أقصى تقريبي للإخراج (يعتمد على المزوّد).
- `user`: توجيه جلسة ثابت.

مقبول حاليًا ولكن **يتم تجاهله**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

المدعوم:

- `previous_response_id`: يعيد OpenClaw استخدام جلسة الاستجابة السابقة عندما يبقى الطلب ضمن النطاق نفسه للوكيل/المستخدم/الجلسة المطلوبة.

## العناصر (`input`)

### `message`

الأدوار: `system` و`developer` و`user` و`assistant`.

- تتم إضافة `system` و`developer` إلى مطالبة النظام.
- يصبح أحدث عنصر `user` أو `function_call_output` هو “الرسالة الحالية”.
- يتم تضمين رسائل المستخدم/المساعد الأقدم كسجل للسياق.

### `function_call_output` (أدوات قائمة على الأدوار)

أرسل نتائج الأدوات مرة أخرى إلى النموذج:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` و`item_reference`

يتم قبولها من أجل توافق المخطط، لكنها تُتجاهل عند بناء المطالبة.

## الأدوات (أدوات function من جهة العميل)

وفّر الأدوات باستخدام `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

إذا قرر الوكيل استدعاء أداة، فستُرجِع الاستجابة عنصر خرج `function_call`.
بعد ذلك ترسل طلب متابعة مع `function_call_output` لمتابعة الدور.

## الصور (`input_image`)

تدعم مصادر base64 أو URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

أنواع MIME المسموح بها (حاليًا): `image/jpeg` و`image/png` و`image/gif` و`image/webp` و`image/heic` و`image/heif`.
الحد الأقصى للحجم (حاليًا): 10MB.

## الملفات (`input_file`)

تدعم مصادر base64 أو URL:

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

أنواع MIME المسموح بها (حاليًا): `text/plain` و`text/markdown` و`text/html` و`text/csv`,
و`application/json` و`application/pdf`.

الحد الأقصى للحجم (حاليًا): 5MB.

السلوك الحالي:

- يتم فك محتوى الملف وإضافته إلى **مطالبة النظام**، وليس إلى رسالة المستخدم،
  بحيث يظل مؤقتًا (ولا يُحفَظ في سجل الجلسة).
- يُغلّف نص الملف المفكوك بوصفه **محتوى خارجيًا غير موثوق** قبل إضافته،
  بحيث تُعامَل بايتات الملف على أنها بيانات، لا تعليمات موثوقة.
- تستخدم الكتلة المحقونة علامات حدود صريحة مثل
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن
  سطر بيانات وصفية من نوع `Source: External`.
- يتعمد مسار إدخال الملف هذا حذف شعار `SECURITY NOTICE:` الطويل
  للحفاظ على ميزانية المطالبة؛ بينما تظل علامات الحدود والبيانات الوصفية موجودة.
- يتم تحليل PDFs أولًا لاستخراج النص. وإذا وُجد نص قليل، تتم
  تحويل الصفحات الأولى إلى صور وتمريرها إلى النموذج، وتستخدم كتلة الملف المحقونة
  العنصر النائب `[PDF content rendered to images]`.

يستخدم تحليل PDF بنية `pdfjs-dist` القديمة المناسبة لـ Node (من دون worker). أما
بنية PDF.js الحديثة فتتوقع browser workers/DOM globals، لذلك لا تُستخدم في Gateway.

القيم الافتراضية لجلب URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (إجمالي أجزاء `input_file` + `input_image` المعتمدة على URL لكل طلب)
- الطلبات محمية (تحليل DNS، وحظر IP الخاص، وحدود إعادة التوجيه، والمهلات).
- تُدعم قوائم سماح لأسماء المضيفين بشكل اختياري لكل نوع إدخال (`files.urlAllowlist`, `images.urlAllowlist`).
  - مضيف مطابق تمامًا: `"cdn.example.com"`
  - نطاقات فرعية wildcard: `"*.assets.example.com"` (لا يطابق النطاق الرئيسي)
  - تعني قوائم السماح الفارغة أو المحذوفة عدم وجود قيد لقائمة سماح اسم المضيف.
- لتعطيل عمليات الجلب المعتمدة على URL بالكامل، اضبط `files.allowUrl: false` و/أو `images.allowUrl: false`.

## حدود الملفات + الصور (الإعداد)

يمكن ضبط القيم الافتراضية تحت `gateway.http.endpoints.responses`:

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

القيم الافتراضية عند حذفها:

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
- تُقبل مصادر `input_image` من نوع HEIC/HEIF وتُوحَّد إلى JPEG قبل التسليم إلى المزوّد.

ملاحظة أمنية:

- تُفرض قوائم سماح URL قبل الجلب وعلى قفزات إعادة التوجيه.
- لا يؤدي السماح لاسم مضيف إلى تجاوز حظر IPات الخاصة/الداخلية.
- بالنسبة إلى الـ gateways المعروضة على الإنترنت، طبّق ضوابط خروج الشبكة بالإضافة إلى وسائل الحماية على مستوى التطبيق.
  راجع [الأمان](/ar/gateway/security).

## البث (SSE)

اضبط `stream: true` لتلقي Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- يكون كل سطر حدث على الشكل `event: <type>` و`data: <json>`
- ينتهي البث بـ `data: [DONE]`

أنواع الأحداث التي تُرسل حاليًا:

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

يتم ملء `usage` عندما يبلّغ المزوّد الأساسي عن أعداد الرموز.
يوحّد OpenClaw الأسماء البديلة الشائعة على نمط OpenAI قبل وصول هذه العدادات
إلى أسطح الحالة/الجلسة اللاحقة، بما في ذلك `input_tokens` / `output_tokens`
و`prompt_tokens` / `completion_tokens`.

## الأخطاء

تستخدم الأخطاء كائن JSON بالشكل:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

الحالات الشائعة:

- `401` مصادقة مفقودة/غير صالحة
- `400` متن طلب غير صالح
- `405` طريقة غير صحيحة

## أمثلة

بدون بث:

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

مع البث:

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

## ذو صلة

- [OpenAI chat completions](/ar/gateway/openai-http-api)
- [OpenAI](/ar/providers/openai)
