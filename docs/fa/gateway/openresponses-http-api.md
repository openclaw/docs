---
read_when:
    - یکپارچه‌سازی کلاینت‌هایی که با OpenResponses API سازگارند
    - به ورودی‌های مبتنی بر آیتم، فراخوانی‌های ابزار کلاینت، یا رویدادهای SSE نیاز دارید
summary: یک نقطه‌پایانی HTTP سازگار با OpenResponses در مسیر /v1/responses از طریق Gateway در دسترس قرار دهید
title: رابط برنامه‌نویسی OpenResponses
x-i18n:
    generated_at: "2026-04-29T22:54:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1cfba4c2572fab2d2ef6bceecd1ae0a022850c46125c62d5a5f3969d07d03aff
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

OpenClaw’s Gateway می‌تواند یک نقطه پایانی سازگار با OpenResponses با عنوان `POST /v1/responses` ارائه کند.

این نقطه پایانی **به‌صورت پیش‌فرض غیرفعال است**. ابتدا آن را در پیکربندی فعال کنید.

- `POST /v1/responses`
- همان پورت Gateway (چندبخشی WS + HTTP): `http://<gateway-host>:<port>/v1/responses`

در پشت‌صحنه، درخواست‌ها مثل یک اجرای معمولی عامل Gateway اجرا می‌شوند (همان مسیر کد
`openclaw agent`)، بنابراین مسیریابی/مجوزها/پیکربندی با Gateway شما مطابقت دارد.

## احراز هویت، امنیت، و مسیریابی

رفتار عملیاتی با [تکمیل‌های گفت‌وگوی OpenAI](/fa/gateway/openai-http-api) مطابقت دارد:

- از مسیر احراز هویت HTTP متناظر Gateway استفاده کنید:
  - احراز هویت با راز مشترک (`gateway.auth.mode="token"` یا `"password"`): `Authorization: Bearer <token-or-password>`
  - احراز هویت پروکسی مورد اعتماد (`gateway.auth.mode="trusted-proxy"`): سرآیندهای پروکسی آگاه از هویت از یک منبع پروکسی مورد اعتماد پیکربندی‌شده؛ پروکسی‌های loopback روی همان میزبان نیازمند `gateway.auth.trustedProxy.allowLoopback = true` صریح هستند
  - احراز هویت باز برای ورودی خصوصی (`gateway.auth.mode="none"`): بدون سرآیند احراز هویت
- با این نقطه پایانی مثل دسترسی کامل اپراتور برای نمونه gateway رفتار کنید
- برای حالت‌های احراز هویت با راز مشترک (`token` و `password`)، مقادیر محدودتر `x-openclaw-scopes` اعلام‌شده توسط bearer را نادیده بگیرید و پیش‌فرض‌های عادی اپراتور کامل را بازگردانید
- برای حالت‌های HTTP حامل هویت مورد اعتماد (برای مثال احراز هویت پروکسی مورد اعتماد یا `gateway.auth.mode="none"`)، در صورت وجود `x-openclaw-scopes` به آن احترام بگذارید و در غیر این صورت به مجموعه محدوده پیش‌فرض عادی اپراتور برگردید
- عامل‌ها را با `model: "openclaw"`، `model: "openclaw/default"`، `model: "openclaw/<agentId>"`، یا `x-openclaw-agent-id` انتخاب کنید
- وقتی می‌خواهید مدل پشتوانه عامل انتخاب‌شده را بازنویسی کنید، از `x-openclaw-model` استفاده کنید
- برای مسیریابی صریح نشست از `x-openclaw-session-key` استفاده کنید
- وقتی زمینه کانال ورودی مصنوعی غیرپیش‌فرض می‌خواهید، از `x-openclaw-message-channel` استفاده کنید

ماتریس احراز هویت:

- `gateway.auth.mode="token"` یا `"password"` + `Authorization: Bearer ...`
  - داشتن راز مشترک اپراتور gateway را اثبات می‌کند
  - `x-openclaw-scopes` محدودتر را نادیده می‌گیرد
  - مجموعه کامل محدوده پیش‌فرض اپراتور را بازمی‌گرداند:
    `operator.admin`، `operator.approvals`، `operator.pairing`،
    `operator.read`، `operator.talk.secrets`، `operator.write`
  - نوبت‌های گفت‌وگو روی این نقطه پایانی را نوبت‌های مالک-فرستنده در نظر می‌گیرد
- حالت‌های HTTP حامل هویت مورد اعتماد (برای مثال احراز هویت پروکسی مورد اعتماد، یا `gateway.auth.mode="none"` روی ورودی خصوصی)
  - وقتی سرآیند موجود است، به `x-openclaw-scopes` احترام می‌گذارند
  - وقتی سرآیند وجود ندارد، به مجموعه محدوده پیش‌فرض عادی اپراتور برمی‌گردند
  - فقط زمانی معنای مالک را از دست می‌دهند که فراخواننده به‌صراحت محدوده‌ها را محدود کند و `operator.admin` را حذف کند

این نقطه پایانی را با `gateway.http.endpoints.responses.enabled` فعال یا غیرفعال کنید.

همین سطح سازگاری همچنین شامل این موارد است:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/chat/completions`

برای توضیح مرجع درباره اینکه مدل‌های هدف‌گیر عامل، `openclaw/default`، عبور مستقیم embeddings، و بازنویسی‌های مدل پشتوانه چگونه کنار هم قرار می‌گیرند، [تکمیل‌های گفت‌وگوی OpenAI](/fa/gateway/openai-http-api#agent-first-model-contract) و [فهرست مدل و مسیریابی عامل](/fa/gateway/openai-http-api#model-list-and-agent-routing) را ببینید.

## رفتار نشست

به‌صورت پیش‌فرض، این نقطه پایانی **برای هر درخواست بدون وضعیت** است (در هر فراخوانی یک کلید نشست جدید تولید می‌شود).

اگر درخواست شامل یک رشته `user` از OpenResponses باشد، Gateway یک کلید نشست پایدار
از آن استخراج می‌کند، بنابراین فراخوانی‌های تکراری می‌توانند یک نشست عامل را به اشتراک بگذارند.

## شکل درخواست (پشتیبانی‌شده)

درخواست از API OpenResponses با ورودی مبتنی بر آیتم پیروی می‌کند. پشتیبانی فعلی:

- `input`: رشته یا آرایه‌ای از اشیای آیتم.
- `instructions`: در اعلان سیستم ادغام می‌شود.
- `tools`: تعریف‌های ابزار سمت کلاینت (ابزارهای تابع).
- `tool_choice`: ابزارهای کلاینت را فیلتر یا الزام می‌کند.
- `stream`: پخش SSE را فعال می‌کند.
- `max_output_tokens`: محدودیت خروجی با بهترین تلاش (وابسته به ارائه‌دهنده).
- `user`: مسیریابی نشست پایدار.

پذیرفته می‌شود اما **در حال حاضر نادیده گرفته می‌شود**:

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `truncation`

پشتیبانی‌شده:

- `previous_response_id`: وقتی درخواست در همان محدوده عامل/کاربر/نشستِ درخواست‌شده باقی بماند، OpenClaw نشست پاسخ قبلی را دوباره استفاده می‌کند.

## آیتم‌ها (ورودی)

### `message`

نقش‌ها: `system`، `developer`، `user`، `assistant`.

- `system` و `developer` به اعلان سیستم افزوده می‌شوند.
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

برای سازگاری طرح‌واره پذیرفته می‌شوند اما هنگام ساخت اعلان نادیده گرفته می‌شوند.

## ابزارها (ابزارهای تابع سمت کلاینت)

ابزارها را با `tools: [{ type: "function", function: { name, description?, parameters? } }]` ارائه کنید.

اگر عامل تصمیم بگیرد ابزاری را فراخوانی کند، پاسخ یک آیتم خروجی `function_call` برمی‌گرداند.
سپس برای ادامه نوبت، یک درخواست پیگیری با `function_call_output` ارسال می‌کنید.

## تصاویر (`input_image`)

از منابع base64 یا URL پشتیبانی می‌کند:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

انواع MIME مجاز (فعلی): `image/jpeg`، `image/png`، `image/gif`، `image/webp`، `image/heic`، `image/heif`.
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

انواع MIME مجاز (فعلی): `text/plain`، `text/markdown`، `text/html`، `text/csv`،
`application/json`، `application/pdf`.

حداکثر اندازه (فعلی): 5MB.

رفتار فعلی:

- محتوای فایل رمزگشایی می‌شود و به **اعلان سیستم** افزوده می‌شود، نه پیام کاربر،
  بنابراین گذرا باقی می‌ماند (در تاریخچه نشست پایدار نمی‌شود).
- متن فایل رمزگشایی‌شده پیش از افزوده شدن، به‌عنوان **محتوای خارجی غیرقابل اعتماد** بسته‌بندی می‌شود،
  بنابراین بایت‌های فایل به‌عنوان داده در نظر گرفته می‌شوند، نه دستورالعمل‌های قابل اعتماد.
- بلوک تزریق‌شده از نشانگرهای مرزی صریحی مانند
  `<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` /
  `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>` استفاده می‌کند و شامل یک خط فراداده
  `Source: External` است.
- این مسیر ورودی فایل عمدا بنر بلند `SECURITY NOTICE:` را حذف می‌کند تا
  بودجه اعلان حفظ شود؛ نشانگرهای مرزی و فراداده همچنان برقرار می‌مانند.
- PDFها ابتدا برای متن تجزیه می‌شوند. اگر متن کمی پیدا شود، صفحه‌های نخست
  به تصویر تبدیل می‌شوند و به مدل داده می‌شوند، و بلوک فایل تزریق‌شده از
  جای‌نگهدار `[PDF content rendered to images]` استفاده می‌کند.

تجزیه PDF توسط Plugin همراه `document-extract` ارائه می‌شود، که از ساخت legacy سازگار با
Node در `pdfjs-dist` استفاده می‌کند (بدون worker). ساخت مدرن PDF.js
انتظار workerهای مرورگر/سراسری‌های DOM را دارد، بنابراین در Gateway استفاده نمی‌شود.

پیش‌فرض‌های دریافت URL:

- `files.allowUrl`: `true`
- `images.allowUrl`: `true`
- `maxUrlParts`: `8` (مجموع بخش‌های مبتنی بر URL از `input_file` + `input_image` در هر درخواست)
- درخواست‌ها محافظت می‌شوند (حل DNS، مسدودسازی IP خصوصی، سقف‌های تغییرمسیر، مهلت‌ها).
- allowlistهای اختیاری نام میزبان برای هر نوع ورودی پشتیبانی می‌شوند (`files.urlAllowlist`، `images.urlAllowlist`).
  - میزبان دقیق: `"cdn.example.com"`
  - زیردامنه‌های wildcard: `"*.assets.example.com"` (با apex مطابقت ندارد)
  - allowlistهای خالی یا حذف‌شده یعنی محدودیت allowlist نام میزبان وجود ندارد.
- برای غیرفعال کردن کامل دریافت‌های مبتنی بر URL، `files.allowUrl: false` و/یا `images.allowUrl: false` را تنظیم کنید.

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
- منابع HEIC/HEIF `input_image` پذیرفته می‌شوند و پیش از تحویل به ارائه‌دهنده به JPEG عادی‌سازی می‌شوند.

نکته امنیتی:

- allowlistهای URL پیش از دریافت و در پرش‌های تغییرمسیر اعمال می‌شوند.
- قراردادن یک نام میزبان در allowlist، مسدودسازی IP خصوصی/داخلی را دور نمی‌زند.
- برای gatewayهای در معرض اینترنت، علاوه بر محافظ‌های سطح برنامه، کنترل‌های خروجی شبکه را اعمال کنید.
  [امنیت](/fa/gateway/security) را ببینید.

## پخش (SSE)

برای دریافت Server-Sent Events (SSE)، `stream: true` را تنظیم کنید:

- `Content-Type: text/event-stream`
- هر خط رویداد `event: <type>` و `data: <json>` است
- جریان با `data: [DONE]` پایان می‌یابد

انواع رویدادهایی که در حال حاضر منتشر می‌شوند:

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed` (در صورت خطا)

## مصرف

`usage` زمانی پر می‌شود که ارائه‌دهنده زیرین شمارش توکن‌ها را گزارش کند.
OpenClaw نام‌های مستعار رایج به سبک OpenAI را پیش از رسیدن این شمارنده‌ها به
سطح‌های وضعیت/نشست پایین‌دستی عادی‌سازی می‌کند، از جمله `input_tokens` / `output_tokens`
و `prompt_tokens` / `completion_tokens`.

## خطاها

خطاها از یک شیء JSON مانند این استفاده می‌کنند:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

موارد رایج:

- `401` احراز هویت ناموجود/نامعتبر
- `400` بدنه درخواست نامعتبر
- `405` روش نادرست

## مثال‌ها

بدون پخش:

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

با پخش:

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

- [تکمیل‌های گفت‌وگوی OpenAI](/fa/gateway/openai-http-api)
- [OpenAI](/fa/providers/openai)
