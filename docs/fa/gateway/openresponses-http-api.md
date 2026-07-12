---
read_when:
    - یکپارچه‌سازی کلاینت‌هایی که از OpenResponses API استفاده می‌کنند
    - شما ورودی‌های مبتنی بر آیتم، فراخوانی ابزارهای کلاینت یا رویدادهای SSE می‌خواهید
summary: یک نقطهٔ پایانی HTTP سازگار با OpenResponses به نشانی /v1/responses از Gateway ارائه کنید
title: API ‏OpenResponses
x-i18n:
    generated_at: "2026-07-12T10:04:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fcf5016d1455383181923ec31b26cf31533b990045df300f0356f135c95579
    source_path: gateway/openresponses-http-api.md
    workflow: 16
---

Gateway می‌تواند یک نقطهٔ پایانی سازگار با OpenResponses در مسیر `POST /v1/responses` ارائه کند. این قابلیت **به‌طور پیش‌فرض غیرفعال است** و درگاه خود را با Gateway به‌اشتراک می‌گذارد (چندگانه‌سازی WS و HTTP): `http://<gateway-host>:<port>/v1/responses`.

درخواست‌ها مانند اجرای عادی عامل Gateway اجرا می‌شوند (همان مسیر کد `openclaw agent`)، بنابراین مسیریابی، مجوزها و پیکربندی با Gateway شما یکسان‌اند.

با `gateway.http.endpoints.responses.enabled` آن را فعال یا غیرفعال کنید. وقتی فعال باشد، همین سطح سازگاری مسیرهای `GET /v1/models`،‏ `GET /v1/models/{id}`،‏ `POST /v1/embeddings` و `POST /v1/chat/completions` را نیز ارائه می‌کند.

## احراز هویت، امنیت و مسیریابی

رفتار عملیاتی با [OpenAI Chat Completions](/fa/gateway/openai-http-api) مطابقت دارد:

- مسیر احراز هویت با `gateway.auth.mode` مطابقت دارد: حالت راز مشترک (`token`/`password`) از `Authorization: Bearer <token-or-password>` استفاده می‌کند؛ پراکسی مورداعتماد از سرآیندهای پراکسی آگاه از هویت استفاده می‌کند (پراکسی‌های local loopback روی همان میزبان به `gateway.auth.trustedProxy.allowLoopback = true` نیاز دارند و وقتی هیچ‌یک از سرآیندهای `Forwarded`/`X-Forwarded-*`/`X-Real-IP` موجود نباشد، بازگشت مستقیم روی همان میزبان از طریق `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` انجام می‌شود)؛ حالت `none` در ورودی خصوصی به سرآیند احراز هویت نیاز ندارد. به [احراز هویت پراکسی مورداعتماد](/fa/gateway/trusted-proxy-auth) مراجعه کنید.
- نقطهٔ پایانی را معادل دسترسی کامل اپراتور به نمونهٔ Gateway در نظر بگیرید.
- حالت‌های احراز هویت راز مشترک، `x-openclaw-scopes` محدودتری را که در توکن حامل اعلام شده نادیده می‌گیرند و مجموعهٔ کامل پیش‌فرض حوزه‌های اپراتور را بازیابی می‌کنند: `operator.admin`،‏ `operator.approvals`،‏ `operator.pairing`،‏ `operator.read`،‏ `operator.talk.secrets`،‏ `operator.write`. نوبت‌های گفت‌وگو در این نقطهٔ پایانی به‌عنوان نوبت‌های فرستندهٔ مالک در نظر گرفته می‌شوند.
- حالت‌های HTTP حامل هویت مورداعتماد (پراکسی مورداعتماد یا `gateway.auth.mode="none"`) در صورت وجود `x-openclaw-scopes` آن را رعایت می‌کنند؛ در غیر این صورت به مجموعهٔ پیش‌فرض حوزه‌های اپراتور بازمی‌گردند. معناشناسی مالک فقط زمانی از بین می‌رود که فراخواننده صراحتاً حوزه‌ها را محدود کند و `operator.admin` را حذف کند.
- عامل‌ها را با `model: "openclaw"`،‏ `"openclaw/default"`،‏ `"openclaw/<agentId>"` یا سرآیند `x-openclaw-agent-id` انتخاب کنید.
- برای جایگزین‌کردن مدل پشتیبان عامل انتخاب‌شده از `x-openclaw-model` استفاده کنید (در مسیرهای احراز هویت حامل هویت به `operator.admin` نیاز دارد).
- برای مسیریابی صریح نشست از `x-openclaw-session-key` استفاده کنید (اگر از فضای نام رزروشدهٔ `subagent:`،‏ `cron:` یا `acp:` استفاده کند، با `400 invalid_request_error` رد می‌شود).
- برای زمینهٔ کانال ورودی مصنوعیِ غیراپیش‌فرض از `x-openclaw-message-channel` استفاده کنید.

برای توضیح مرجع دربارهٔ مدل‌های هدف عامل، `openclaw/default`، عبور مستقیم تعبیه‌سازی‌ها و جایگزینی مدل پشتیبان، به [OpenAI Chat Completions](/fa/gateway/openai-http-api#agent-first-model-contract) مراجعه کنید.

به [حوزه‌های اپراتور](/fa/gateway/operator-scopes) و [امنیت](/fa/gateway/security) مراجعه کنید.

## رفتار نشست

به‌طور پیش‌فرض، نقطهٔ پایانی **برای هر درخواست بدون حالت است** (در هر فراخوانی یک کلید نشست جدید تولید می‌شود).

اگر درخواست شامل رشتهٔ OpenResponses در `user` باشد، Gateway یک کلید نشست پایدار از آن استخراج می‌کند تا فراخوانی‌های تکراری بتوانند یک نشست عامل را به‌اشتراک بگذارند.

`previous_response_id` نشست پاسخ پیشین را زمانی دوباره استفاده می‌کند که درخواست در همان محدودهٔ عامل/کاربر/نشست درخواستی باقی بماند (بر اساس موضوع احراز هویت، شناسهٔ عامل و `x-openclaw-session-key` تطبیق داده می‌شود).

## ساختار درخواست

| فیلد                                                             | پشتیبانی                                                                                                                                  |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `input`                                                          | رشته یا آرایه‌ای از اشیای مورد.                                                                                                           |
| `instructions`                                                   | در اعلان سیستم ادغام می‌شود.                                                                                                              |
| `tools`                                                          | تعریف ابزارهای کارخواه (ابزارهای تابعی).                                                                                                  |
| `tool_choice`                                                    | `"auto"`،‏ `"none"`،‏ `"required"` یا `{ "type": "function", "name": "..." }` برای پالایش یا الزامی‌کردن ابزارهای کارخواه.                 |
| `stream`                                                         | جریان‌دهی SSE را فعال می‌کند.                                                                                                              |
| `max_output_tokens`                                              | محدودیت خروجی بر مبنای بهترین تلاش (وابسته به ارائه‌دهنده).                                                                                |
| `temperature`                                                    | دمای نمونه‌گیری بر مبنای بهترین تلاش. پشتیبان Codex Responses مبتنی بر ChatGPT آن را نادیده می‌گیرد، زیرا از نمونه‌گیری ثابت سمت سرور استفاده می‌کند. |
| `top_p`                                                          | نمونه‌گیری هسته‌ای بر مبنای بهترین تلاش. همان ملاحظهٔ Codex Responses مربوط به `temperature` اعمال می‌شود.                                |
| `user`                                                           | مسیریابی پایدار نشست.                                                                                                                      |
| `previous_response_id`                                           | تداوم نشست (به بخش بالا مراجعه کنید).                                                                                                      |
| `max_tool_calls`،‏ `reasoning`،‏ `metadata`،‏ `store`،‏ `truncation` | پذیرفته می‌شوند، اما در حال حاضر نادیده گرفته می‌شوند.                                                                                     |

## موارد (`input`)

### `message`

نقش‌ها: `system`،‏ `developer`،‏ `user`،‏ `assistant`.

- `system` و `developer` به اعلان سیستم افزوده می‌شوند.
- جدیدترین مورد `user` یا `function_call_output` به «پیام جاری» تبدیل می‌شود.
- پیام‌های پیشین کاربر/دستیار به‌عنوان تاریخچه برای زمینه گنجانده می‌شوند.

### `function_call_output` (ابزارهای نوبت‌محور)

نتایج ابزار را به مدل بازگردانید:

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` و `item_reference`

برای سازگاری طرحواره پذیرفته می‌شوند، اما هنگام ساخت اعلان نادیده گرفته می‌شوند.

## ابزارها (ابزارهای تابعی سمت کارخواه)

ابزارها را با `tools: [{ type: "function", name, description?, parameters? }]` ارائه کنید.

اگر عامل ابزاری را فراخوانی کند، پاسخ یک مورد خروجی `function_call` بازمی‌گرداند. برای ادامهٔ نوبت، یک درخواست پیگیری با `function_call_output` ارسال کنید.

برای `tool_choice: "required"` و `tool_choice` سنجاق‌شده به تابع، نقطهٔ پایانی مجموعهٔ ابزارهای تابعی کارخواهِ در معرض را محدود می‌کند، به محیط اجرا دستور می‌دهد پیش از پاسخ‌دادن یک ابزار کارخواه را فراخوانی کند و اگر نوبت شامل فراخوانی ساخت‌یافتهٔ منطبقِ ابزار کارخواه نباشد، آن را مطابق قرارداد `/v1/chat/completions` رد می‌کند. درخواست‌های بدون جریان‌دهی، `502` را همراه با `api_error` بازمی‌گردانند؛ درخواست‌های جریانی یک رویداد `response.failed` منتشر می‌کنند.

## تصاویر (`input_image`)

از منابع base64 یا URL پشتیبانی می‌کند:

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

انواع MIME مجاز (پیش‌فرض): `image/jpeg`،‏ `image/png`،‏ `image/gif`،‏ `image/webp`،‏ `image/heic`،‏ `image/heif`. حداکثر اندازه (پیش‌فرض): 10MB.

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

انواع MIME مجاز (پیش‌فرض): `text/plain`،‏ `text/markdown`،‏ `text/html`،‏ `text/csv`،‏ `application/json`،‏ `application/pdf`. حداکثر اندازه (پیش‌فرض): 5MB.

رفتار فعلی:

- محتوای فایل رمزگشایی و به **اعلان سیستم** افزوده می‌شود، نه پیام کاربر؛ بنابراین موقتی باقی می‌ماند (در تاریخچهٔ نشست ماندگار نمی‌شود).
- متن رمزگشایی‌شدهٔ فایل پیش از افزوده‌شدن به‌عنوان **محتوای خارجی غیرقابل‌اعتماد** بسته‌بندی می‌شود؛ بنابراین بایت‌های فایل داده تلقی می‌شوند، نه دستورالعمل‌های مورداعتماد. بلوک تزریق‌شده از نشانگرهای مرزی صریح (`<<<EXTERNAL_UNTRUSTED_CONTENT id="...">>>` / `<<<END_EXTERNAL_UNTRUSTED_CONTENT id="...">>>`) و یک خط فرادادهٔ `Source: External` استفاده می‌کند. برای حفظ بودجهٔ اعلان، بنر طولانی `SECURITY NOTICE:` عمداً حذف شده است؛ نشانگرهای مرزی و فراداده همچنان اعمال می‌شوند.
- ابتدا متن PDFها تجزیه می‌شود. اگر متن کمی یافت شود، صفحه‌های نخست به تصاویر رستری تبدیل و به مدل داده می‌شوند و بلوک فایل تزریق‌شده از جای‌نگهدار `[PDF content rendered to images]` استفاده می‌کند.

تجزیهٔ PDF را Plugin همراه `document-extract` فراهم می‌کند که برای استخراج متن و رندر صفحه از `clawpdf` و محیط اجرای بسته‌بندی‌شدهٔ PDFium WebAssembly آن استفاده می‌کند.

پیش‌فرض‌های واکشی URL:

- `files.allowUrl`:‏ `true`
- `images.allowUrl`:‏ `true`
- `maxUrlParts`:‏ `8` (مجموع بخش‌های مبتنی بر URL از نوع `input_file` و `input_image` در هر درخواست)
- درخواست‌ها محافظت می‌شوند (تفکیک DNS، مسدودسازی IP خصوصی، سقف تغییرمسیر و مهلت زمانی).
- فهرست‌های مجاز اختیاری نام میزبان برای هر نوع ورودی پشتیبانی می‌شوند (`files.urlAllowlist`،‏ `images.urlAllowlist`): میزبان دقیق (`"cdn.example.com"`) یا زیردامنه‌های عام (`"*.assets.example.com"` که با دامنهٔ ریشه مطابقت ندارد). فهرست مجاز خالی یا حذف‌شده به‌معنای نبود محدودیت فهرست مجاز نام میزبان است.
- برای غیرفعال‌کردن کامل واکشی‌های مبتنی بر URL،‏ `files.allowUrl: false` و/یا `images.allowUrl: false` را تنظیم کنید.

## محدودیت‌های فایل و تصویر (پیکربندی)

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

پیش‌فرض‌ها در صورت حذف:

| کلید                     | پیش‌فرض   |
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

منابع `input_image` با قالب HEIC/HEIF پیش از تحویل به ارائه‌دهنده، از طریق پردازشگر تصویر مشترک OpenClaw ‏(Rastermill) به JPEG تبدیل می‌شوند. این پردازشگر برای قالب‌هایی که به پشتیبانی کدک خارجی نیاز دارند، به یک مبدل سیستمی (`sips`،‏ ImageMagick،‏ GraphicsMagick یا ffmpeg) بازمی‌گردد.

یادداشت امنیتی: فهرست‌های مجاز URL پیش از واکشی و در هر گام تغییرمسیر اعمال می‌شوند. افزودن نام میزبان به فهرست مجاز، مسدودسازی IPهای خصوصی/داخلی را دور نمی‌زند. برای Gatewayهای در معرض اینترنت، علاوه بر محافظ‌های سطح برنامه، کنترل‌های خروجی شبکه را نیز اعمال کنید. به [امنیت](/fa/gateway/security) مراجعه کنید.

## جریان‌دهی (SSE)

برای دریافت رویدادهای ارسال‌شده از سرور، `stream: true` را تنظیم کنید:

- `Content-Type: text/event-stream`
- هر خط رویداد به‌شکل `event: <type>` و `data: <json>` است
- جریان با `data: [DONE]` پایان می‌یابد

نوع رویدادهایی که در حال حاضر منتشر می‌شوند: `response.created`، `response.in_progress`، `response.output_item.added`، `response.content_part.added`، `response.output_text.delta`، `response.output_text.done`، `response.content_part.done`، `response.output_item.done`، `response.completed`، `response.failed` (در صورت خطا).

## میزان استفاده

هنگامی که ارائه‌دهندهٔ زیربنایی تعداد توکن‌ها را گزارش کند، `usage` مقداردهی می‌شود. OpenClaw نام‌های مستعار رایج به سبک OpenAI، از جمله `input_tokens` / `output_tokens` و `prompt_tokens` / `completion_tokens`، را پیش از رسیدن این شمارنده‌ها به بخش‌های پایین‌دستی وضعیت/نشست یکسان‌سازی می‌کند.

## خطاها

خطاها از یک شیء JSON مانند زیر استفاده می‌کنند:

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

موارد رایج: `400` بدنهٔ درخواست نامعتبر، `401` احراز هویت موجود نیست/نامعتبر است، `403` محدودهٔ عملگر موجود نیست، `405` متد نادرست، `429` تلاش‌های ناموفق احراز هویت بیش از حد (همراه با `Retry-After`).

## مثال‌ها

بدون جریان:

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

با جریان:

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
- [محدوده‌های عملگر](/fa/gateway/operator-scopes)
- [OpenAI](/fa/providers/openai)
