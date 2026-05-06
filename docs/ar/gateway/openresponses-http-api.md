---
read_when:
    - دمج البرامج العميلة المتوافقة مع OpenResponses API
    - تريد مُدخلات قائمة على العناصر، أو استدعاءات أدوات العميل، أو أحداث SSE
summary: إتاحة نقطة نهاية HTTP ‏/v1/responses متوافقة مع OpenResponses من Gateway
title: واجهة برمجة تطبيقات OpenResponses
x-i18n:
    generated_at: "2026-05-06T07:55:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69d46dc448a8856a6f3213f2fbfdba000a342ec4dcf258435b7029102cfb8119
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

يمكن لـ Gateway الخاص بـ OpenClaw تقديم نقطة نهاية متوافقة مع OpenResponses باسم `POST /v1/responses`.

نقطة النهاية هذه **معطلة افتراضيًا**. فعّلها في الإعداد أولًا.

- `POST /v1/responses`
- المنفذ نفسه مثل Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

داخليًا، تُنفذ الطلبات كتشغيل وكيل Gateway عادي (مسار التعليمات البرمجية نفسه مثل
`openclaw agent`)، لذلك تتطابق التوجيه/الأذونات/الإعدادات مع Gateway لديك.

## المصادقة والأمان والتوجيه

يطابق السلوك التشغيلي [إكمالات محادثة OpenAI](/ar/gateway/openai-http-api):

- استخدم مسار مصادقة HTTP المطابق في Gateway:
  - مصادقة السر المشترك (`gateway.auth.mode="token"` أو `"password"`): `Authorization: Bearer <token-or-password>`
  - مصادقة الوكيل الموثوق (`gateway.auth.mode="trusted-proxy"`): ترويسات وكيل واعية بالهوية من مصدر وكيل موثوق مُعد؛ تتطلب وكلاء local loopback على المضيف نفسه ضبطًا صريحًا لـ `gateway.auth.trustedProxy.allowLoopback = true`
  - مصادقة الدخول الخاص المفتوحة (`gateway.auth.mode="none"`): لا توجد ترويسة مصادقة
- تعامل مع نقطة النهاية كأنها وصول مشغل كامل لمثيل Gateway
- في أوضاع مصادقة السر المشترك (`token` و`password`)، تجاهل قيم `x-openclaw-scopes` الأضيق المعلنة في bearer واستعد افتراضيات المشغل الكاملة العادية
- في أوضاع HTTP الحاملة لهوية موثوقة (مثل مصادقة الوكيل الموثوق أو `gateway.auth.mode="none"`)، احترم `x-openclaw-scopes` عند وجودها، وإلا فارجع إلى مجموعة النطاقات الافتراضية العادية للمشغل
- اختر الوكلاء باستخدام `model: "openclaw"` أو `model: "openclaw/default"` أو `model: "openclaw/<agentId>"` أو `x-openclaw-agent-id`
- استخدم `x-openclaw-model` عندما تريد تجاوز نموذج الواجهة الخلفية للوكيل المحدد
- استخدم `x-openclaw-session-key` لتوجيه الجلسة الصريح
- استخدم `x-openclaw-message-channel` عندما تريد سياق قناة دخول اصطناعية غير افتراضية

مصفوفة المصادقة:

- `gateway.auth.mode="token"` أو `"password"` + `Authorization: Bearer ...`
  - يثبت امتلاك سر مشغل Gateway المشترك
  - يتجاهل `x-openclaw-scopes` الأضيق
  - يستعيد مجموعة نطاقات المشغل الافتراضية الكاملة:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - يتعامل مع أدوار المحادثة على نقطة النهاية هذه كأدوار مرسل مالك
- أوضاع HTTP الحاملة لهوية موثوقة (مثل مصادقة الوكيل الموثوق، أو `gateway.auth.mode="none"` على الدخول الخاص)
  - تحترم `x-openclaw-scopes` عندما تكون الترويسة موجودة
  - ترجع إلى مجموعة نطاقات المشغل الافتراضية العادية عندما تكون الترويسة غائبة
  - لا تفقد دلالات المالك إلا عندما يضيّق المستدعي النطاقات صراحةً ويحذف `operator.admin`

فعّل نقطة النهاية هذه أو عطّلها باستخدام `gateway.http.endpoints.responses.enabled`.

يتضمن سطح التوافق نفسه أيضًا:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

للاطلاع على الشرح المرجعي لكيفية توافق نماذج استهداف الوكيل، و`openclaw/default`، وتمرير التضمينات، وتجاوزات نموذج الواجهة الخلفية معًا، راجع [إكمالات محادثة OpenAI](/ar/gateway/openai-http-api#agent-first-model-contract) و[قائمة النماذج وتوجيه الوكلاء](/ar/gateway/openai-http-api#model-list-and-agent-routing).

## سلوك الجلسة

افتراضيًا تكون نقطة النهاية **عديمة الحالة لكل طلب** (يُنشأ مفتاح جلسة جديد في كل استدعاء).

إذا تضمن الطلب سلسلة OpenResponses باسم `user`، يشتق Gateway مفتاح جلسة ثابتًا
منها، بحيث يمكن للاستدعاءات المتكررة مشاركة جلسة وكيل.

## شكل الطلب (مدعوم)

يتبع الطلب واجهة OpenResponses API مع إدخال قائم على العناصر. الدعم الحالي:

- `input`: سلسلة نصية أو مصفوفة من كائنات عناصر.
- `instructions`: تُدمج في موجه النظام.
- `tools`: تعريفات أدوات العميل (أدوات الدوال).
- `tool_choice`: يرشح أدوات العميل أو يتطلبها.
- `stream`: يفعّل بث SSE.
- `max_output_tokens`: حد مخرجات بأفضل جهد (يعتمد على المزوّد).
- `user`: توجيه جلسة ثابت.

مقبول لكن **يُتجاهل حاليًا**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

مدعوم:

- `previous_response_id`: يعيد OpenClaw استخدام جلسة الاستجابة السابقة عندما يبقى الطلب ضمن نطاق الوكيل/المستخدم/الجلسة المطلوبة نفسه.

## العناصر (الإدخال)

### `message`

الأدوار: `system` و`developer` و`user` و`assistant`.

- يُلحق `system` و`developer` بموجه النظام.
- يصبح أحدث عنصر `user` أو `function_call_output` هو "الرسالة الحالية".
- تُدرج رسائل المستخدم/المساعد السابقة كسجل للسياق.

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

مقبولان لتوافق المخطط لكنهما يُتجاهلان عند بناء الموجه.

## الأدوات (أدوات دوال من جانب العميل)

وفر الأدوات باستخدام `tools: [{ type: "function", function: { name, description?, parameters? } }]`.

إذا قرر الوكيل استدعاء أداة، فستُرجع الاستجابة عنصر إخراج `function_call`.
بعد ذلك ترسل طلب متابعة مع `function_call_output` لمواصلة الدور.

## الصور (`input_image`)

يدعم مصادر base64 أو URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

أنواع MIME المسموح بها (حاليًا): `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/heic`, `image/heif`.
الحجم الأقصى (حاليًا): 10MB.

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

أنواع MIME المسموح بها (حاليًا): `text/plain`, `text/markdown`, `text/html`, `text/csv`,
`application/json`, `application/pdf`.

الحجم الأقصى (حاليًا): 5MB.

السلوك الحالي:

- يُفك ترميز محتوى الملف ويُضاف إلى **موجه النظام**، لا إلى رسالة المستخدم،
  لذلك يبقى مؤقتًا (لا يستمر في سجل الجلسة).
- يُلف نص الملف المفكك ترميزه كـ **محتوى خارجي غير موثوق** قبل إضافته،
  بحيث تُعامل بايتات الملف كبيانات، لا كتعليمات موثوقة.
- تستخدم الكتلة المُحقنة علامات حدود صريحة مثل
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` وتتضمن سطر بيانات وصفية
  `Source: External`.
- يحذف مسار إدخال الملفات هذا عمدًا لافتة `SECURITY NOTICE:` الطويلة للحفاظ على
  ميزانية الموجه؛ وتبقى علامات الحدود والبيانات الوصفية في مكانها.
- تُحلل ملفات PDF لاستخراج النص أولًا. إذا وُجد نص قليل، تُحوّل الصفحات الأولى
  إلى صور نقطية وتُمرر إلى النموذج، وتستخدم كتلة الملف المُحقنة
  العنصر النائب `[PDF content rendered to images]`.

يوفر Plugin المضمّن `document-extract` تحليل PDF، وهو يستخدم بنية `pdfjs-dist` القديمة
الصديقة لـ Node (بلا عامل). تتوقع بنية PDF.js الحديثة
عمال متصفح/عموميات DOM، لذلك لا تُستخدم في Gateway.

افتراضيات جلب URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (إجمالي أجزاء `input_file` + `input_image` القائمة على URL لكل طلب)
- الطلبات محمية (حل DNS، حظر عناوين IP الخاصة، حدود إعادة التوجيه، المهل الزمنية).
- تُدعم قوائم السماح الاختيارية بأسماء المضيفين لكل نوع إدخال (`files.urlAllowlist`, `images.urlAllowlist`).
  - مضيف دقيق: `"cdn.example.com"`
  - نطاقات فرعية بحرف بدل: `"*.assets.example.com"` (لا يطابق apex)
  - تعني قوائم السماح الفارغة أو المحذوفة عدم وجود قيد قائمة سماح لأسماء المضيفين.
- لتعطيل عمليات الجلب القائمة على URL بالكامل، اضبط `files.allowUrl: false` و/أو `images.allowUrl: false`.

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
- تُقبل مصادر HEIC/HEIF لـ `input_image` وتُطبّع إلى JPEG قبل التسليم إلى المزوّد.

ملاحظة أمنية:

- تُفرض قوائم السماح لـ URL قبل الجلب وعلى قفزات إعادة التوجيه.
- لا يتجاوز السماح باسم مضيف حظر عناوين IP الخاصة/الداخلية.
- بالنسبة إلى Gateways المعروضة على الإنترنت، طبّق ضوابط خروج الشبكة إضافةً إلى حراس مستوى التطبيق.
  راجع [الأمان](/ar/gateway/security).

## البث (SSE)

اضبط `stream: true` لتلقي أحداث Server-Sent Events (SSE):

- `Content-Type: text/event-stream`
- كل سطر حدث هو `event: <type>` و`data: <json>`
- ينتهي البث بـ `data: [DONE]`

أنواع الأحداث المنبعثة حاليًا:

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

تُملأ `usage` عندما يبلّغ المزوّد الأساسي عن أعداد الرموز.
يطبع OpenClaw الأسماء المستعارة الشائعة بأسلوب OpenAI قبل وصول تلك العدادات إلى
أسطح الحالة/الجلسة اللاحقة، بما في ذلك `input_tokens` / `output_tokens`
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

بلا بث:

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

## ذات صلة

- [إكمالات محادثة OpenAI](/ar/gateway/openai-http-api)
- [OpenAI](/ar/providers/openai)
