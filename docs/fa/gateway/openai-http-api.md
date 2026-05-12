---
read_when:
    - یکپارچه‌سازی ابزارهایی که انتظار OpenAI Chat Completions را دارند
summary: نقطهٔ پایانی HTTP سازگار با OpenAI در مسیر /v1/chat/completions را از Gateway در دسترس قرار دهید
title: تکمیل‌های چت OpenAI
x-i18n:
    generated_at: "2026-05-12T15:43:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 21d901ab70908d6e4e3770e716319b961348c2a7ff6ef9bb2d0ffc6952a073f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway متعلق به OpenClaw می‌تواند یک نقطهٔ پایانی کوچک Chat Completions سازگار با OpenAI ارائه کند.

این نقطهٔ پایانی **به‌صورت پیش‌فرض غیرفعال است**. ابتدا آن را در پیکربندی فعال کنید.

- `POST /v1/chat/completions`
- همان پورت Gateway (چندگانه‌سازی WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

وقتی سطح HTTP سازگار با OpenAI در Gateway فعال باشد، این موارد را نیز ارائه می‌کند:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

در پشت صحنه، درخواست‌ها به‌عنوان اجرای عادی عامل Gateway اجرا می‌شوند (همان مسیر کد `openclaw agent`)؛ بنابراین مسیریابی/مجوزها/پیکربندی با Gateway شما هم‌خوان است.

## احراز هویت

از پیکربندی احراز هویت Gateway استفاده می‌کند.

مسیرهای رایج احراز هویت HTTP:

- احراز هویت با راز مشترک (`gateway.auth.mode="token"` یا `"password"`):
  `Authorization: Bearer <token-or-password>`
- احراز هویت HTTP معتمدِ دارای هویت (`gateway.auth.mode="trusted-proxy"`):
  از طریق پروکسی پیکربندی‌شدهٔ آگاه از هویت مسیریابی کنید و اجازه دهید سرآیندهای
  هویتی لازم را تزریق کند
- احراز هویت باز برای ورودی خصوصی (`gateway.auth.mode="none"`):
  هیچ سرآیند احراز هویتی لازم نیست

نکات:

- وقتی `gateway.auth.mode="token"` است، از `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`) استفاده کنید.
- وقتی `gateway.auth.mode="password"` است، از `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) استفاده کنید.
- وقتی `gateway.auth.mode="trusted-proxy"` است، درخواست HTTP باید از یک
  منبع پروکسی معتمد پیکربندی‌شده بیاید؛ پروکسی‌های loopback همان میزبان به
  `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
- اگر `gateway.auth.rateLimit` پیکربندی شده باشد و شکست‌های احراز هویت بیش از حد رخ دهد، نقطهٔ پایانی `429` را همراه با `Retry-After` برمی‌گرداند.

## مرز امنیتی (مهم)

این نقطهٔ پایانی را به‌عنوان سطحی با **دسترسی کامل اپراتور** برای نمونهٔ gateway در نظر بگیرید.

- احراز هویت bearer در HTTP اینجا یک مدل دامنهٔ محدودِ جداگانه برای هر کاربر نیست.
- token/password معتبر Gateway برای این نقطهٔ پایانی باید مانند اعتبارنامهٔ مالک/اپراتور تلقی شود.
- درخواست‌ها از همان مسیر عامل صفحهٔ کنترل اجرا می‌شوند که کنش‌های معتمد اپراتور از آن عبور می‌کنند.
- در این نقطهٔ پایانی مرز ابزار جداگانهٔ غیرمالک/هرکاربر وجود ندارد؛ وقتی فراخواننده اینجا از احراز هویت Gateway عبور کند، OpenClaw آن فراخواننده را برای این gateway یک اپراتور معتمد تلقی می‌کند.
- برای حالت‌های احراز هویت با راز مشترک (`token` و `password`)، نقطهٔ پایانی حتی اگر فراخواننده سرآیند محدودتر `x-openclaw-scopes` بفرستد، پیش‌فرض‌های معمولِ کامل اپراتور را بازیابی می‌کند.
- حالت‌های HTTP معتمدِ دارای هویت (برای مثال احراز هویت پروکسی معتمد یا `gateway.auth.mode="none"`) وقتی `x-openclaw-scopes` حاضر باشد آن را رعایت می‌کنند و در غیر این صورت به مجموعهٔ دامنه‌های پیش‌فرض معمول اپراتور برمی‌گردند.
- اگر سیاست عامل هدف ابزارهای حساس را مجاز کند، این نقطهٔ پایانی می‌تواند از آن‌ها استفاده کند.
- این نقطهٔ پایانی را فقط روی loopback/tailnet/ورودی خصوصی نگه دارید؛ آن را مستقیماً در معرض اینترنت عمومی قرار ندهید.

ماتریس احراز هویت:

- `gateway.auth.mode="token"` یا `"password"` + `Authorization: Bearer ...`
  - مالکیت راز مشترک اپراتور gateway را اثبات می‌کند
  - `x-openclaw-scopes` محدودتر را نادیده می‌گیرد
  - مجموعهٔ کامل دامنه‌های پیش‌فرض اپراتور را بازیابی می‌کند:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - نوبت‌های گفت‌وگو در این نقطهٔ پایانی را نوبت‌های ارسال‌شده از طرف مالک تلقی می‌کند
- حالت‌های HTTP معتمدِ دارای هویت (برای مثال احراز هویت پروکسی معتمد، یا `gateway.auth.mode="none"` روی ورودی خصوصی)
  - یک هویت معتمد بیرونی یا مرز استقرار را احراز هویت می‌کنند
  - وقتی سرآیند حاضر باشد، `x-openclaw-scopes` را رعایت می‌کنند
  - وقتی سرآیند غایب باشد، به مجموعهٔ دامنه‌های پیش‌فرض معمول اپراتور برمی‌گردند
  - فقط زمانی معناشناسی مالک را از دست می‌دهند که فراخواننده به‌صراحت دامنه‌ها را محدود کند و `operator.admin` را حذف کند

[امنیت](/fa/gateway/security) و [دسترسی از راه دور](/fa/gateway/remote) را ببینید.

## قرارداد مدل عامل-محور

OpenClaw فیلد `model` در OpenAI را یک **هدف عامل** تلقی می‌کند، نه شناسهٔ خام مدل ارائه‌دهنده.

- `model: "openclaw"` به عامل پیش‌فرض پیکربندی‌شده مسیریابی می‌شود.
- `model: "openclaw/default"` نیز به عامل پیش‌فرض پیکربندی‌شده مسیریابی می‌شود.
- `model: "openclaw/<agentId>"` به یک عامل مشخص مسیریابی می‌شود.

سرآیندهای اختیاری درخواست:

- `x-openclaw-model: <provider/model-or-bare-id>` مدل backend را برای عامل انتخاب‌شده بازنویسی می‌کند.
- `x-openclaw-agent-id: <agentId>` همچنان به‌عنوان بازنویسی سازگاری پشتیبانی می‌شود.
- `x-openclaw-session-key: <sessionKey>` مسیریابی نشست را به‌طور کامل کنترل می‌کند.
- `x-openclaw-message-channel: <channel>` زمینهٔ کانال ورودی مصنوعی را برای پرامپت‌ها و سیاست‌های آگاه از کانال تنظیم می‌کند.

نام‌های مستعار سازگاری همچنان پذیرفته می‌شوند:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## فعال‌کردن نقطهٔ پایانی

`gateway.http.endpoints.chatCompletions.enabled` را روی `true` تنظیم کنید:

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

## غیرفعال‌کردن نقطهٔ پایانی

`gateway.http.endpoints.chatCompletions.enabled` را روی `false` تنظیم کنید:

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

## رفتار نشست

به‌صورت پیش‌فرض، نقطهٔ پایانی **برای هر درخواست بی‌حالت** است (در هر فراخوانی یک کلید نشست جدید تولید می‌شود).

اگر درخواست شامل رشتهٔ `user` در OpenAI باشد، Gateway یک کلید نشست پایدار از آن استخراج می‌کند تا فراخوانی‌های تکراری بتوانند یک نشست عامل را به اشتراک بگذارند.

## چرا این سطح مهم است

این مجموعهٔ سازگاری، بیشترین اثرگذاری را برای فرانت‌اندها و ابزارهای خودمیزبان دارد:

- بیشتر راه‌اندازی‌های Open WebUI، LobeChat، و LibreChat انتظار `/v1/models` را دارند.
- بسیاری از سامانه‌های RAG انتظار `/v1/embeddings` را دارند.
- کلاینت‌های گفت‌وگوی موجود OpenAI معمولاً می‌توانند با `/v1/chat/completions` شروع کنند.
- کلاینت‌های بومیِ عامل به‌طور فزاینده‌ای `/v1/responses` را ترجیح می‌دهند.

## فهرست مدل و مسیریابی عامل

<AccordionGroup>
  <Accordion title="`/v1/models` چه چیزی برمی‌گرداند؟">
    فهرستی از اهداف عامل OpenClaw.

    شناسه‌های برگشتی شامل ورودی‌های `openclaw`، `openclaw/default`، و `openclaw/<agentId>` هستند.
    آن‌ها را مستقیماً به‌عنوان مقادیر `model` در OpenAI استفاده کنید.

  </Accordion>
  <Accordion title="آیا `/v1/models` عامل‌ها یا زیرعامل‌ها را فهرست می‌کند؟">
    اهداف عامل سطح بالا را فهرست می‌کند، نه مدل‌های ارائه‌دهندهٔ backend و نه زیرعامل‌ها.

    زیرعامل‌ها توپولوژی اجرای داخلی باقی می‌مانند. آن‌ها به‌عنوان شبه‌مدل ظاهر نمی‌شوند.

  </Accordion>
  <Accordion title="چرا `openclaw/default` گنجانده شده است؟">
    `openclaw/default` نام مستعار پایدار برای عامل پیش‌فرض پیکربندی‌شده است.

    این یعنی کلاینت‌ها حتی اگر شناسهٔ واقعی عامل پیش‌فرض بین محیط‌ها تغییر کند، می‌توانند همچنان از یک شناسهٔ قابل پیش‌بینی استفاده کنند.

  </Accordion>
  <Accordion title="چگونه مدل backend را بازنویسی کنم؟">
    از `x-openclaw-model` استفاده کنید.

    مثال‌ها:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    اگر آن را حذف کنید، عامل انتخاب‌شده با انتخاب مدل پیکربندی‌شدهٔ معمول خود اجرا می‌شود.

  </Accordion>
  <Accordion title="تعبیه‌ها چگونه در این قرارداد جای می‌گیرند؟">
    `/v1/embeddings` از همان شناسه‌های `model` هدف عامل استفاده می‌کند.

    از `model: "openclaw/default"` یا `model: "openclaw/<agentId>"` استفاده کنید.
    وقتی به یک مدل تعبیهٔ مشخص نیاز دارید، آن را در `x-openclaw-model` بفرستید.
    بدون آن سرآیند، درخواست به تنظیمات معمول تعبیهٔ عامل انتخاب‌شده منتقل می‌شود.

  </Accordion>
</AccordionGroup>

## جریان‌دهی (SSE)

برای دریافت رویدادهای ارسال‌شده از سرور (SSE)، `stream: true` را تنظیم کنید:

- `Content-Type: text/event-stream`
- هر خط رویداد `data: <json>` است
- جریان با `data: [DONE]` پایان می‌یابد

## قرارداد ابزار گفت‌وگو

`/v1/chat/completions` از زیرمجموعه‌ای از ابزارهای تابعی سازگار با کلاینت‌های رایج OpenAI Chat پشتیبانی می‌کند.

### فیلدهای پشتیبانی‌شدهٔ درخواست

- `tools`: آرایه‌ای از `{ "type": "function", "function": { ... } }`
- `tool_choice`: `"auto"`, `"none"`
- `messages[*].role: "tool"` نوبت‌های پیگیری
- `messages[*].tool_call_id` برای اتصال نتایج ابزار به فراخوانی ابزار قبلی
- `max_completion_tokens`: عدد؛ سقف هر فراخوانی برای کل توکن‌های تکمیل (شامل توکن‌های استدلال). نام فیلد فعلی OpenAI Chat Completions؛ وقتی هر دو `max_completion_tokens` و `max_tokens` ارسال شوند، ترجیح داده می‌شود.
- `max_tokens`: عدد؛ نام مستعار قدیمی که برای سازگاری عقب‌رو پذیرفته می‌شود. وقتی `max_completion_tokens` نیز حاضر باشد نادیده گرفته می‌شود.

وقتی هرکدام از این فیلدها تنظیم شود، مقدار از طریق کانال پارامتر جریان عامل به ارائه‌دهندهٔ بالادستی فرستاده می‌شود. نام فیلد واقعی ارسال‌شده به ارائه‌دهندهٔ بالادستی توسط انتقال‌دهندهٔ ارائه‌دهنده انتخاب می‌شود: `max_completion_tokens` برای نقاط پایانی خانوادهٔ OpenAI، و `max_tokens` برای ارائه‌دهندگانی که فقط نام قدیمی را می‌پذیرند (مانند Mistral و Chutes).

### گونه‌های پشتیبانی‌نشده

نقطهٔ پایانی برای گونه‌های ابزار پشتیبانی‌نشده، از جمله موارد زیر، `400 invalid_request_error` برمی‌گرداند:

- `tools` غیرآرایه‌ای
- ورودی‌های ابزار غیرتابعی
- `tool.function.name` گمشده
- گونه‌های `tool_choice` مانند `allowed_tools` و `custom`
- `tool_choice: "required"` (هنوز در زمان اجرا اعمال نمی‌شود؛ وقتی اعمال سخت‌گیرانه پیاده‌سازی شود پشتیبانی خواهد شد)
- `tool_choice: { "type": "function", "function": { "name": "..." } }` (همان منطق `required`)
- مقادیر `tool_choice.function.name` که با `tools` ارائه‌شده مطابقت ندارند

### شکل پاسخ ابزار غیرجریانی

وقتی عامل تصمیم می‌گیرد ابزارها را فراخوانی کند، پاسخ از این شکل استفاده می‌کند:

- `choices[0].finish_reason = "tool_calls"`
- ورودی‌های `choices[0].message.tool_calls[]` با:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (رشتهٔ JSON)

توضیح‌های دستیار پیش از فراخوانی ابزار در `choices[0].message.content` برگردانده می‌شود (ممکن است خالی باشد).

### شکل پاسخ ابزار جریانی

وقتی `stream: true` باشد، فراخوانی‌های ابزار به‌صورت قطعه‌های افزایشی SSE منتشر می‌شوند:

- دلتا‌ی اولیهٔ نقش دستیار
- دلتاهای اختیاری توضیح دستیار
- یک یا چند قطعهٔ `delta.tool_calls` که هویت ابزار و قطعه‌های آرگومان را حمل می‌کنند
- قطعهٔ نهایی با `finish_reason: "tool_calls"`
- `data: [DONE]`

اگر `stream_options.include_usage=true` باشد، یک قطعهٔ usage انتهایی پیش از `[DONE]` منتشر می‌شود.

### حلقهٔ پیگیری ابزار

پس از دریافت `tool_calls`، کلاینت باید تابع(های) درخواست‌شده را اجرا کند و یک درخواست پیگیری بفرستد که شامل این موارد باشد:

- پیام قبلی فراخوانی ابزار دستیار
- یک یا چند پیام `role: "tool"` با `tool_call_id` مطابق

این به اجرای عامل gateway اجازه می‌دهد همان حلقهٔ استدلال را ادامه دهد و پاسخ نهایی دستیار را تولید کند.

## راه‌اندازی سریع Open WebUI

برای اتصال پایهٔ Open WebUI:

- URL پایه: `http://127.0.0.1:18789/v1`
- URL پایهٔ Docker روی macOS: `http://host.docker.internal:18789/v1`
- کلید API: توکن bearer متعلق به Gateway شما
- مدل: `openclaw/default`

رفتار مورد انتظار:

- `GET /v1/models` باید `openclaw/default` را فهرست کند
- Open WebUI باید از `openclaw/default` به‌عنوان شناسهٔ مدل گفت‌وگو استفاده کند
- اگر برای آن عامل یک ارائه‌دهنده/مدل backend مشخص می‌خواهید، مدل پیش‌فرض معمول عامل را تنظیم کنید یا `x-openclaw-model` را بفرستید

آزمایش smoke سریع:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

اگر این `openclaw/default` را برگرداند، بیشتر راه‌اندازی‌های Open WebUI می‌توانند با همان URL پایه و توکن متصل شوند.

## مثال‌ها

بدون جریان‌دهی:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

جریانی:

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

فهرست‌کردن مدل‌ها:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

دریافت یک مدل:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

ایجاد تعبیه‌ها:

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

نکات:

- `/v1/models` هدف‌های عامل OpenClaw را برمی‌گرداند، نه کاتالوگ‌های خام ارائه‌دهنده را.
- `openclaw/default` همیشه موجود است تا یک شناسه‌ی پایدار در همه‌ی محیط‌ها کار کند.
- بازنویسی‌های ارائه‌دهنده/مدلِ بک‌اند باید در `x-openclaw-model` قرار بگیرند، نه در فیلد `model` مربوط به OpenAI.
- `/v1/embeddings` از `input` به‌صورت یک رشته یا آرایه‌ای از رشته‌ها پشتیبانی می‌کند.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [OpenAI](/fa/providers/openai)
