---
read_when:
    - یکپارچه‌سازی کلاینت‌هایی که با OpenResponses API کار می‌کنند
    - به ورودی‌های مبتنی بر مورد، فراخوانی‌های ابزار کلاینت یا رویدادهای SSE نیاز دارید
summary: ارائهٔ یک نقطهٔ پایانی HTTP سازگار با OpenResponses در مسیر ‎/v1/responses‎ از Gateway
title: API OpenResponses
x-i18n:
    generated_at: "2026-06-27T17:46:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fbc41a14f5c585a0fb0aae96fb3d2376f94cdb77f41bcd7cc5e7998a27673c44
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway در OpenClaw می‌تواند یک نقطه پایانی سازگار با OpenResponses برای `POST /v1/responses` ارائه کند.

این نقطه پایانی به‌صورت **پیش‌فرض غیرفعال** است. ابتدا آن را در پیکربندی فعال کنید.

- `POST /v1/responses`
- همان درگاه Gateway (چندگانه‌سازی WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

در پشت صحنه، درخواست‌ها به‌عنوان یک اجرای عادی عامل Gateway اجرا می‌شوند (همان مسیر کدی که
`openclaw agent` استفاده می‌کند)، بنابراین مسیریابی/مجوزها/پیکربندی با Gateway شما مطابقت دارد.

## احراز هویت، امنیت، و مسیریابی

رفتار عملیاتی با [OpenAI Chat Completions](/fa/gateway/openai-http-api) مطابقت دارد:

- از مسیر احراز هویت HTTP متناظر Gateway استفاده کنید:
  - احراز هویت با راز مشترک (`gateway.auth.mode="token"` یا `"password"`): `Authorization: Bearer <token-or-password>`
  - احراز هویت پراکسی معتمد (`gateway.auth.mode="trusted-proxy"`): سرآیندهای پراکسی آگاه از هویت از یک منبع پراکسی معتمد پیکربندی‌شده؛ پراکسی‌های loopback هم‌میزبان به `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند
  - fallback مستقیم محلی پراکسی معتمد: فراخواننده‌های هم‌میزبان بدون سرآیندهای `Forwarded`،‏ `X-Forwarded-*`، یا `X-Real-IP` می‌توانند از `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` استفاده کنند
  - احراز هویت باز ورودی خصوصی (`gateway.auth.mode="none"`): بدون سرآیند احراز هویت
- این نقطه پایانی را به‌عنوان دسترسی کامل اپراتور برای نمونه gateway در نظر بگیرید
- برای حالت‌های احراز هویت با راز مشترک (`token` و `password`)، مقادیر محدودتر `x-openclaw-scopes` اعلام‌شده توسط bearer را نادیده بگیرید و پیش‌فرض‌های عادی اپراتور کامل را بازیابی کنید
- برای حالت‌های HTTP دارای هویت معتمد (برای مثال احراز هویت پراکسی معتمد یا `gateway.auth.mode="none"`)، در صورت وجود `x-openclaw-scopes` آن را رعایت کنید و در غیر این صورت به مجموعه scope پیش‌فرض عادی اپراتور برگردید
- عامل‌ها را با `model: "openclaw"`،‏ `model: "openclaw/default"`،‏ `model: "openclaw/<agentId>"`، یا `x-openclaw-agent-id` انتخاب کنید
- وقتی می‌خواهید مدل backend عامل انتخاب‌شده را override کنید، از `x-openclaw-model` استفاده کنید
- برای مسیریابی صریح نشست از `x-openclaw-session-key` استفاده کنید
- وقتی می‌خواهید زمینه کانال ورودی ساختگی غیرپیش‌فرض داشته باشید، از `x-openclaw-message-channel` استفاده کنید

ماتریس احراز هویت:

- `gateway.auth.mode="token"` یا `"password"` + `Authorization: Bearer ...`
  - مالکیت راز مشترک اپراتور gateway را اثبات می‌کند
  - `x-openclaw-scopes` محدودتر را نادیده می‌گیرد
  - مجموعه scope پیش‌فرض کامل اپراتور را بازیابی می‌کند:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - نوبت‌های چت روی این نقطه پایانی را به‌عنوان نوبت‌های فرستنده-مالک در نظر می‌گیرد
- حالت‌های HTTP دارای هویت معتمد (برای مثال احراز هویت پراکسی معتمد، یا `gateway.auth.mode="none"` روی ورودی خصوصی)
  - وقتی سرآیند وجود داشته باشد، `x-openclaw-scopes` را رعایت می‌کنند
  - وقتی سرآیند وجود نداشته باشد، به مجموعه scope پیش‌فرض عادی اپراتور برمی‌گردند
  - فقط وقتی معناشناسی مالک را از دست می‌دهند که فراخواننده scopeها را صریحاً محدود کند و `operator.admin` را حذف کند

این نقطه پایانی را با `gateway.http.endpoints.responses.enabled` فعال یا غیرفعال کنید.

همان سطح سازگاری همچنین شامل این موارد است:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

برای توضیح مرجع درباره اینکه مدل‌های هدف‌گیری عامل، `openclaw/default`، عبور embeddingها، و overrideهای مدل backend چگونه کنار هم قرار می‌گیرند، [OpenAI Chat Completions](/fa/gateway/openai-http-api#agent-first-model-contract) و [فهرست مدل و مسیریابی عامل](/fa/gateway/openai-http-api#model-list-and-agent-routing) را ببینید.

## رفتار نشست

به‌صورت پیش‌فرض، این نقطه پایانی **برای هر درخواست بدون حالت** است (در هر فراخوانی یک کلید نشست جدید تولید می‌شود).

اگر درخواست شامل رشته OpenResponses `user` باشد، Gateway یک کلید نشست پایدار
از آن استخراج می‌کند تا فراخوانی‌های تکراری بتوانند یک نشست عامل را به اشتراک بگذارند.

## شکل درخواست (پشتیبانی‌شده)

درخواست از API OpenResponses با ورودی مبتنی بر آیتم پیروی می‌کند. پشتیبانی فعلی:

- `input`: رشته یا آرایه‌ای از آبجکت‌های آیتم.
- `instructions`: در prompt سیستم ادغام می‌شود.
- `tools`: تعریف‌های ابزار کلاینت (ابزارهای تابع).
- `tool_choice`:‏ `"auto"`،‏ `"none"`،‏ `"required"`، یا `{ "type": "function", "name": "..." }` برای فیلتر یا الزامی‌کردن ابزارهای کلاینت.
- `stream`: پخش SSE را فعال می‌کند.
- `max_output_tokens`: محدودیت خروجی best-effort (وابسته به provider).
- `temperature`: دمای نمونه‌برداری best-effort که به provider ارسال می‌شود. توسط backend مبتنی بر ChatGPT برای Codex Responses نادیده گرفته می‌شود، چون از نمونه‌برداری ثابت سمت سرور استفاده می‌کند.
- `top_p`: نمونه‌برداری هسته‌ای best-effort که به provider ارسال می‌شود. همان ملاحظه Codex Responses مثل `temperature` برقرار است.
- `user`: مسیریابی نشست پایدار.

پذیرفته می‌شوند اما **در حال حاضر نادیده گرفته می‌شوند**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

پشتیبانی‌شده:

- `previous_response_id`: وقتی درخواست در همان محدوده عامل/کاربر/نشست درخواستی باقی بماند، OpenClaw از نشست پاسخ قبلی دوباره استفاده می‌کند.

## آیتم‌ها (ورودی)

### `message`

نقش‌ها: `system`،‏ `developer`،‏ `user`،‏ `assistant`.

- `system` و `developer` به prompt سیستم افزوده می‌شوند.
- جدیدترین آیتم `user` یا `function_call_output` به «پیام فعلی» تبدیل می‌شود.
- پیام‌های قبلی کاربر/دستیار به‌عنوان تاریخچه برای زمینه گنجانده می‌شوند.

### `function_call_output` (ابزارهای مبتنی بر نوبت)

نتایج ابزار را به مدل برگردانید:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` و `item_reference`

برای سازگاری schema پذیرفته می‌شوند اما هنگام ساخت prompt نادیده گرفته می‌شوند.

## ابزارها (ابزارهای تابع سمت کلاینت)

ابزارها را با `tools: [{ type: "function", name, description?, parameters? }]` ارائه کنید.

اگر عامل تصمیم بگیرد ابزاری را فراخوانی کند، پاسخ یک آیتم خروجی `function_call` برمی‌گرداند.
سپس برای ادامه نوبت، یک درخواست follow-up با `function_call_output` ارسال می‌کنید.

برای `tool_choice: "required"` و `tool_choice` سنجاق‌شده به تابع، نقطه پایانی مجموعه ابزارهای تابع کلاینت در معرض دید را محدود می‌کند، به runtime دستور می‌دهد قبل از پاسخ دادن یک ابزار کلاینت را فراخوانی کند، و اگر نوبت شامل یک فراخوانی ابزار کلاینت ساختاریافته مطابق نباشد، آن را رد می‌کند. این قرارداد برای فهرست HTTP `tools` ارائه‌شده توسط فراخواننده اعمال می‌شود، نه هر ابزار داخلی عامل OpenClaw. درخواست‌های non-streaming مقدار `502` را با یک `api_error` برمی‌گردانند؛ درخواست‌های streaming یک رویداد `response.failed` منتشر می‌کنند. این با قرارداد `/v1/chat/completions` مطابقت دارد.

## تصاویر (`input_image`)

از منابع base64 یا URL پشتیبانی می‌کند:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

انواع MIME مجاز (فعلی): `image/jpeg`،‏ `image/png`،‏ `image/gif`،‏ `image/webp`،‏ `image/heic`،‏ `image/heif`.
حداکثر اندازه (فعلی): 10MB.

## فایل‌ها (`input_file`)

از منابع base64 یا URL پشتیبانی می‌کند:

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

انواع MIME مجاز (فعلی): `text/plain`،‏ `text/markdown`،‏ `text/html`،‏ `text/csv`،
`application/json`،‏ `application/pdf`.

حداکثر اندازه (فعلی): 5MB.

رفتار فعلی:

- محتوای فایل decode می‌شود و به **prompt سیستم** افزوده می‌شود، نه پیام کاربر،
  بنابراین ephemeral باقی می‌ماند (در تاریخچه نشست persist نمی‌شود).
- متن فایل decodeشده پیش از افزوده‌شدن، به‌عنوان **محتوای خارجی غیرمعتمد** wrap می‌شود،
  بنابراین byteهای فایل به‌عنوان داده در نظر گرفته می‌شوند، نه دستورالعمل‌های معتمد.
- بلوک injectشده از نشانگرهای مرزی صریح مثل
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` استفاده می‌کند و شامل یک خط metadata
  `Source: External` است.
- این مسیر ورودی فایل عمداً banner طولانی `SECURITY NOTICE:` را حذف می‌کند تا
  بودجه prompt حفظ شود؛ نشانگرهای مرزی و metadata همچنان سر جای خود باقی می‌مانند.
- PDFها ابتدا برای متن parse می‌شوند. اگر متن کمی پیدا شود، صفحه‌های اول
  به تصاویر rasterize می‌شوند و به مدل پاس داده می‌شوند، و بلوک فایل injectشده از
  placeholder `[PDF content rendered to images]` استفاده می‌کند.

parse کردن PDF توسط Plugin همراه `document-extract` ارائه می‌شود که از
`clawpdf` و runtime بسته‌بندی‌شده PDFium WebAssembly آن برای استخراج متن و
رندر صفحه استفاده می‌کند.

پیش‌فرض‌های fetch از URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (مجموع بخش‌های مبتنی بر URL از `input_file` + `input_image` در هر درخواست)
- درخواست‌ها محافظت می‌شوند (DNS resolution، مسدودسازی IP خصوصی، سقف redirect، timeoutها).
- allowlistهای اختیاری نام میزبان برای هر نوع ورودی پشتیبانی می‌شوند (`files.urlAllowlist`،‏ `images.urlAllowlist`).
  - میزبان دقیق: `"cdn.example.com"`
  - زیردامنه‌های wildcard: `"*.assets.example.com"` (با apex مطابقت ندارد)
  - allowlistهای خالی یا حذف‌شده یعنی محدودیت allowlist نام میزبان وجود ندارد.
- برای غیرفعال‌کردن کامل fetchهای مبتنی بر URL، `files.allowUrl: false` و/یا `images.allowUrl: false` را تنظیم کنید.

## محدودیت‌های فایل + تصویر (پیکربندی)

پیش‌فرض‌ها را می‌توان زیر `gateway.http.endpoints.responses` تنظیم کرد:

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

پیش‌فرض‌ها در صورت حذف:

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
- منابع HEIC/HEIF `input_image` وقتی یک مبدل سیستمی در دسترس باشد پذیرفته می‌شوند و پیش از تحویل به provider به JPEG نرمال‌سازی می‌شوند. مبدل‌های پشتیبانی‌شده عبارت‌اند از `sips` در macOS،‏ ImageMagick،‏ GraphicsMagick، یا ffmpeg.

یادداشت امنیتی:

- allowlistهای URL پیش از fetch و در hopهای redirect اعمال می‌شوند.
- allowlist کردن یک نام میزبان، مسدودسازی IP خصوصی/داخلی را دور نمی‌زند.
- برای gatewayهای در معرض اینترنت، علاوه بر محافظ‌های سطح برنامه، کنترل‌های خروجی شبکه را اعمال کنید.
  [امنیت](/fa/gateway/security) را ببینید.

## پخش (SSE)

برای دریافت Server-Sent Events (SSE)، `stream: true` را تنظیم کنید:

- `Content-Type: text/event-stream`
- هر خط رویداد `event: <type>` و `data: <json>` است
- Stream با `data: [DONE]` پایان می‌یابد

نوع‌های رویداد که در حال حاضر منتشر می‌شوند:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (هنگام خطا)

## استفاده

وقتی provider زیربنایی شمارش tokenها را گزارش کند، `usage` پر می‌شود.
OpenClaw aliasهای رایج به سبک OpenAI را پیش از رسیدن این شمارنده‌ها به
سطوح status/session پایین‌دستی نرمال‌سازی می‌کند، از جمله `input_tokens` / `output_tokens`
و `prompt_tokens` / `completion_tokens`.

## خطاها

خطاها از یک آبجکت JSON مانند زیر استفاده می‌کنند:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

موارد رایج:

- `401` احراز هویت ناموجود/نامعتبر
- `400` بدنه درخواست نامعتبر
- `405` متد اشتباه

## مثال‌ها

Non-streaming:

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

Streaming:

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

## مرتبط

- [تکمیل‌های چت OpenAI](/fa/gateway/openai-http-api)
- [OpenAI](/fa/providers/openai)
