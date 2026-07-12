---
read_when:
    - دمج العملاء الذين يستخدمون واجهة OpenResponses API
    - تريد مُدخلات قائمة على العناصر، أو استدعاءات أدوات العميل، أو أحداث SSE
summary: إتاحة نقطة نهاية HTTP ‏`/v1/responses` متوافقة مع OpenResponses من Gateway
title: واجهة برمجة تطبيقات OpenResponses
x-i18n:
    generated_at: "2026-07-12T05:58:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

يمكن لـ Gateway توفير نقطة نهاية `POST /v1/responses` متوافقة مع OpenResponses. وهي **معطّلة افتراضيًا** وتشارك منفذها مع Gateway (تعدد إرسال WS + HTTP): `http://<gateway-host>:<port>/v1/responses`.

تُنفّذ الطلبات كتشغيل وكيل عادي في Gateway (مسار الشفرة نفسه المستخدم في `openclaw agent`)، لذا تتطابق التوجيهات والأذونات والإعدادات مع Gateway لديك.

يمكن التمكين أو التعطيل باستخدام `gateway.http.endpoints.responses.enabled`. عند التمكين، توفر واجهة التوافق نفسها أيضًا `GET /v1/models` و`GET /v1/models/{id}` و`POST /v1/embeddings` و`POST /v1/chat/completions`.

## المصادقة والأمان والتوجيه

يتطابق السلوك التشغيلي مع [إكمالات محادثة OpenAI](/ar/gateway/openai-http-api):

- يتطابق مسار المصادقة مع `gateway.auth.mode`: يستخدم السر المشترك (`token`/`password`) ترويسة `Authorization: Bearer <token-or-password>`؛ ويستخدم الوكيل الموثوق ترويسات وكيل مدركة للهوية (تتطلب وكلاء الاسترجاع المحلي على المضيف نفسه `gateway.auth.trustedProxy.allowLoopback = true`، مع رجوع مباشر على المضيف نفسه عبر `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` عند عدم وجود ترويسة `Forwarded`/`X-Forwarded-*`/`X-Real-IP`)؛ ولا يحتاج `none` عند الدخول الخاص إلى ترويسة مصادقة. راجع [مصادقة الوكيل الموثوق](/ar/gateway/trusted-proxy-auth).
- تعامل مع نقطة النهاية باعتبارها وصولًا كاملًا للمشغّل إلى مثيل Gateway.
- تتجاهل أوضاع مصادقة السر المشترك نطاقات `x-openclaw-scopes` الأضيق المعلنة عبر رمز الحامل، وتستعيد مجموعة نطاقات المشغّل الافتراضية الكاملة: `operator.admin` و`operator.approvals` و`operator.pairing` و`operator.read` و`operator.talk.secrets` و`operator.write`. تُعامل أدوار المحادثة في نقطة النهاية هذه كأدوار مرسلة من المالك.
- تحترم أوضاع HTTP الموثوقة الحاملة للهوية (الوكيل الموثوق، أو `gateway.auth.mode="none"`) نطاقات `x-openclaw-scopes` عند وجودها، وإلا فترجع إلى مجموعة نطاقات المشغّل الافتراضية. لا تُفقد دلالات المالك إلا عندما يضيّق المستدعي النطاقات صراحةً ويحذف `operator.admin`.
- حدّد الوكلاء باستخدام `model: "openclaw"` أو `"openclaw/default"` أو `"openclaw/<agentId>"` أو ترويسة `x-openclaw-agent-id`.
- استخدم `x-openclaw-model` لتجاوز نموذج الواجهة الخلفية للوكيل المحدد (يتطلب `operator.admin` في مسارات المصادقة الحاملة للهوية).
- استخدم `x-openclaw-session-key` للتوجيه الصريح للجلسة (يُرفض مع `400 invalid_request_error` إذا استخدم نطاقًا محجوزًا: `subagent:` أو `cron:` أو `acp:`).
- استخدم `x-openclaw-message-channel` لسياق قناة دخول اصطناعية غير افتراضية.

للاطلاع على الشرح المرجعي لنماذج استهداف الوكلاء و`openclaw/default` والتمرير المباشر للتضمينات وتجاوزات نموذج الواجهة الخلفية، راجع [إكمالات محادثة OpenAI](/ar/gateway/openai-http-api#agent-first-model-contract).

راجع [نطاقات المشغّل](/ar/gateway/operator-scopes) و[الأمان](/ar/gateway/security).

## سلوك الجلسة

تكون نقطة النهاية افتراضيًا **عديمة الحالة لكل طلب** (يُنشأ مفتاح جلسة جديد مع كل استدعاء).

إذا تضمّن الطلب سلسلة OpenResponses باسم `user`، يشتق Gateway منها مفتاح جلسة ثابتًا بحيث يمكن للاستدعاءات المتكررة مشاركة جلسة وكيل.

يعيد `previous_response_id` استخدام جلسة الاستجابة السابقة عندما يظل الطلب ضمن نطاق الوكيل/المستخدم/الجلسة المطلوبة نفسه (تجري المطابقة حسب موضوع المصادقة ومعرّف الوكيل و`x-openclaw-session-key`).

## بنية الطلب

| الحقل                                                            | الدعم                                                                                                                        |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `input`                                                          | سلسلة أو مصفوفة من كائنات العناصر.                                                                                               |
| `instructions`                                                   | تُدمج في مطالبة النظام.                                                                                                 |
| `tools`                                                          | تعريفات أدوات العميل (أدوات الدوال).                                                                                      |
| `tool_choice`                                                    | `"auto"` أو `"none"` أو `"required"` أو `{ "type": "function", "name": "..." }` لتصفية أدوات العميل أو اشتراطها.                |
| `stream`                                                         | يفعّل البث عبر SSE.                                                                                                         |
| `max_output_tokens`                                              | حد تقريبي للمخرجات (يعتمد على المزوّد).                                                                                 |
| `temperature`                                                    | درجة حرارة أخذ عينات تقريبية. تتجاهلها الواجهة الخلفية لاستجابات Codex المستندة إلى ChatGPT، التي تستخدم أخذ عينات ثابتًا من جانب الخادم. |
| `top_p`                                                          | أخذ عينات نووي تقريبي. ينطبق عليه تنبيه استجابات Codex نفسه الخاص بـ`temperature`.                                                    |
| `user`                                                           | توجيه ثابت للجلسة.                                                                                                        |
| `previous_response_id`                                           | استمرارية الجلسة (راجع أعلاه).                                                                                                |
| `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation` | مقبولة، لكنها متجاهلة حاليًا.                                                                                                |

## العناصر (الإدخال)

### `message`

الأدوار: `system` و`developer` و`user` و`assistant`.

- يُلحق `system` و`developer` بمطالبة النظام.
- يصبح أحدث عنصر `user` أو `function_call_output` هو «الرسالة الحالية».
- تُضمّن رسائل المستخدم/المساعد السابقة كسجل للسياق.

### `function_call_output` (أدوات قائمة على الأدوار)

أرسل نتائج الأدوات إلى النموذج:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` و`item_reference`

مقبولان للتوافق مع المخطط، لكنهما يُتجاهلان عند إنشاء المطالبة.

## الأدوات (أدوات دوال من جانب العميل)

وفّر الأدوات باستخدام `tools: [{ type: "function", name, description?, parameters? }]`.

إذا استدعى الوكيل أداة، تُرجع الاستجابة عنصر إخراج `function_call`. أرسل طلب متابعة يتضمن `function_call_output` لمتابعة الدور.

بالنسبة إلى `tool_choice: "required"` و`tool_choice` المثبّت على دالة، تضيق نقطة النهاية مجموعة أدوات دوال العميل المكشوفة، وتوجّه وقت التشغيل إلى استدعاء أداة عميل قبل الاستجابة، وترفض الدور إذا لم يتضمن استدعاءً منظمًا مطابقًا لأداة عميل، بما يتطابق مع عقد `/v1/chat/completions`. تعيد الطلبات غير المتدفقة `502` مع `api_error`؛ وتصدر الطلبات المتدفقة حدث `response.failed`.

## الصور (`input_image`)

يدعم مصادر base64 أو URL:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

أنواع MIME المسموح بها (افتراضيًا): `image/jpeg` و`image/png` و`image/gif` و`image/webp` و`image/heic` و`image/heif`. الحجم الأقصى (افتراضيًا): 10MB.

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

أنواع MIME المسموح بها (افتراضيًا): `text/plain` و`text/markdown` و`text/html` و`text/csv` و`application/json` و`application/pdf`. الحجم الأقصى (افتراضيًا): 5MB.

السلوك الحالي:

- يُفك ترميز محتوى الملف ويُضاف إلى **مطالبة النظام**، لا إلى رسالة المستخدم، ليظل مؤقتًا (ولا يُحفظ في سجل الجلسة).
- يُغلّف نص الملف المفكوك باعتباره **محتوى خارجيًا غير موثوق** قبل إضافته، بحيث تُعامل بايتات الملف كبيانات لا كتعليمات موثوقة. تستخدم الكتلة المُدخلة علامات حدود صريحة (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) وسطر بيانات وصفية `Source: External`. وتحذف عمدًا لافتة `SECURITY NOTICE:` الطويلة للحفاظ على ميزانية المطالبة؛ وتظل علامات الحدود والبيانات الوصفية مطبقة.
- تُحلل ملفات PDF لاستخراج النص أولًا. إذا عُثر على نص قليل، تُحوّل الصفحات الأولى إلى صور نقطية وتُمرر إلى النموذج، وتستخدم كتلة الملف المُدخلة العنصر النائب `[PDF content rendered to images]`.

يوفّر Plugin المضمّن `document-extract` تحليل PDF، ويستخدم `clawpdf` وبيئة تشغيل PDFium WebAssembly المضمّنة معه لاستخراج النص وعرض الصفحات.

إعدادات جلب URL الافتراضية:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (إجمالي أجزاء `input_file` و`input_image` المستندة إلى URL لكل طلب)
- تخضع الطلبات للحماية (تحليل DNS، وحظر عناوين IP الخاصة، وحدود إعادة التوجيه، والمهلات الزمنية).
- تُدعم اختياريًا قوائم السماح لأسماء المضيفين لكل نوع إدخال (`files.urlAllowlist` و`images.urlAllowlist`): مضيف مطابق تمامًا (`"cdn.example.com"`) أو نطاقات فرعية بأحرف بدل (`"*.assets.example.com"`، لا تطابق النطاق الجذر). تعني قوائم السماح الفارغة أو المحذوفة عدم وجود قيد لقائمة السماح بأسماء المضيفين.
- لتعطيل عمليات الجلب المستندة إلى URL بالكامل، عيّن `files.allowUrl: false` و/أو `images.allowUrl: false`.

## حدود الملفات والصور (الإعدادات)

يمكن ضبط القيم الافتراضية ضمن `gateway.http.endpoints.responses`:

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
            maxChars: 60000,
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

القيم الافتراضية عند الحذف:

| المفتاح                      | القيمة الافتراضية   |
| ------------------------ | --------- |
| `maxBodyBytes`           | 20MB      |
| `maxUrlParts`            | 8         |
| `files.maxBytes`         | 5MB       |
| `files.maxChars`         | 60k       |
| `files.maxRedirects`     | 3         |
| `files.timeoutMs`        | 10s       |
| `files.pdf.maxPages`     | 4         |
| `files.pdf.maxPixels`    | 4,000,000 |
| `files.pdf.minTextChars` | 200       |
| `images.maxBytes`        | 10MB      |
| `images.maxRedirects`    | 3         |
| `images.timeoutMs`       | 10s       |

تُطبّع مصادر `input_image` بتنسيق HEIC/HEIF إلى JPEG قبل تسليمها إلى المزوّد عبر معالج الصور المشترك في OpenClaw ‏(Rastermill)، الذي يرجع إلى محوّل نظام (`sips` أو ImageMagick أو GraphicsMagick أو ffmpeg) للتنسيقات التي تحتاج إلى دعم برنامج ترميز خارجي.

ملاحظة أمنية: تُفرض قوائم السماح لعناوين URL قبل الجلب وعند قفزات إعادة التوجيه. لا يؤدي إدراج اسم مضيف في قائمة السماح إلى تجاوز حظر عناوين IP الخاصة/الداخلية. بالنسبة إلى بوابات Gateway المكشوفة للإنترنت، طبّق ضوابط خروج الشبكة بالإضافة إلى وسائل الحماية على مستوى التطبيق. راجع [الأمان](/ar/gateway/security).

## البث (SSE)

عيّن `stream: true` لتلقي الأحداث المرسلة من الخادم:

- `Content-Type: text/event-stream`
- كل سطر حدث هو `event: <type>` و`data: <json>`
- ينتهي التدفق بـ `data: [DONE]`

أنواع الأحداث المُرسلة حاليًا: `response.created`، و`response.in_progress`، و`response.output_item.added`، و`response.content_part.added`، و`response.output_text.delta`، و`response.output_text.done`، و`response.content_part.done`، و`response.output_item.done`، و`response.completed`، و`response.failed` (عند حدوث خطأ).

## الاستخدام

تُملأ `usage` عندما يبلّغ المزوّد الأساسي عن أعداد الرموز. يطبّع OpenClaw الأسماء البديلة الشائعة بأسلوب OpenAI قبل وصول هذه العدّادات إلى واجهات الحالة/الجلسة اللاحقة، بما في ذلك `input_tokens` / `output_tokens` و`prompt_tokens` / `completion_tokens`.

## الأخطاء

تستخدم الأخطاء كائن JSON مثل:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

الحالات الشائعة: `400` نص طلب غير صالح، و`401` مصادقة مفقودة/غير صالحة، و`403` نطاق المشغّل مفقود، و`405` أسلوب غير صحيح، و`429` محاولات مصادقة فاشلة كثيرة جدًا (مع `Retry-After`).

## أمثلة

من دون تدفق:

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

مع التدفق:

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
- [نطاقات المشغّل](/ar/gateway/operator-scopes)
- [OpenAI](/ar/providers/openai)
