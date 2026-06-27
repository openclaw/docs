---
read_when:
    - یکپارچه‌سازی ابزارهایی که انتظار OpenAI Chat Completions را دارند
summary: یک نقطهٔ پایانی HTTP سازگار با OpenAI به نام /v1/chat/completions را از Gateway ارائه کنید
title: تکمیل‌های چت OpenAI
x-i18n:
    generated_at: "2026-06-27T17:46:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8746f4f5964a5d0b948877b64b5d20440dea3aa45b36813c404cd06660792cf
    source_path: gateway/openai-http-api.md
    workflow: 16
---

Gateway در OpenClaw می‌تواند یک نقطهٔ پایانی کوچک Chat Completions سازگار با OpenAI ارائه کند.

این نقطهٔ پایانی **به‌طور پیش‌فرض غیرفعال است**. ابتدا آن را در پیکربندی فعال کنید.

- `POST /v1/chat/completions`
- همان پورت Gateway (چندبخشی WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

وقتی سطح HTTP سازگار با OpenAI در Gateway فعال باشد، این‌ها را نیز ارائه می‌کند:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

در پشت صحنه، درخواست‌ها مانند یک اجرای عادی عامل Gateway اجرا می‌شوند (همان مسیر کدی که `openclaw agent` استفاده می‌کند)، بنابراین مسیریابی/مجوزها/پیکربندی با Gateway شما یکسان است.

## احراز هویت

از پیکربندی احراز هویت Gateway استفاده می‌کند.

مسیرهای رایج احراز هویت HTTP:

- احراز هویت با راز مشترک (`gateway.auth.mode="token"` یا `"password"`):
  `Authorization: Bearer <token-or-password>`
- احراز هویت HTTP با هویت مورد اعتماد (`gateway.auth.mode="trusted-proxy"`):
  از طریق پراکسی پیکربندی‌شدهٔ آگاه به هویت مسیریابی کنید و اجازه دهید
  سرآیندهای هویتی لازم را تزریق کند
- احراز هویت باز در ورودی خصوصی (`gateway.auth.mode="none"`):
  هیچ سرآیند احراز هویتی لازم نیست

نکات:

- وقتی `gateway.auth.mode="token"` است، از `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`) استفاده کنید.
- وقتی `gateway.auth.mode="password"` است، از `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) استفاده کنید.
- وقتی `gateway.auth.mode="trusted-proxy"` است، درخواست HTTP باید از یک
  منبع پراکسی مورد اعتماد پیکربندی‌شده بیاید؛ پراکسی‌های local loopback روی همان میزبان به
  `gateway.auth.trustedProxy.allowLoopback = true` صریح نیاز دارند.
- فراخوان‌های داخلی روی همان میزبان که پراکسی را دور می‌زنند می‌توانند از
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` به‌عنوان یک جایگزین مستقیم محلی
  استفاده کنند. وجود هر شاهدی در سرآیندهای `Forwarded`،‏ `X-Forwarded-*`، یا `X-Real-IP`
  باعث می‌شود درخواست به‌جای آن روی مسیر trusted-proxy بماند.
- اگر `gateway.auth.rateLimit` پیکربندی شده باشد و شکست‌های احراز هویت بیش از حد رخ دهد، نقطهٔ پایانی `429` را همراه با `Retry-After` برمی‌گرداند.

## مرز امنیتی (مهم)

این نقطهٔ پایانی را به‌عنوان یک سطح **دسترسی کامل اپراتور** برای نمونهٔ Gateway در نظر بگیرید.

- احراز هویت bearer در HTTP اینجا یک مدل محدودهٔ باریک برای هر کاربر نیست.
- توکن/گذرواژهٔ معتبر Gateway برای این نقطهٔ پایانی باید مانند اعتبارنامهٔ مالک/اپراتور تلقی شود.
- درخواست‌ها از همان مسیر عامل صفحهٔ کنترل اجرا می‌شوند که کنش‌های اپراتور مورد اعتماد از آن عبور می‌کنند.
- برای این نقطهٔ پایانی هیچ مرز ابزار جداگانهٔ غیرمالک/برای هر کاربر وجود ندارد؛ وقتی یک فراخوان در اینجا از احراز هویت Gateway عبور کند، OpenClaw آن فراخوان را برای این Gateway یک اپراتور مورد اعتماد تلقی می‌کند.
- برای حالت‌های احراز هویت با راز مشترک (`token` و `password`)، این نقطهٔ پایانی پیش‌فرض‌های عادی کامل اپراتور را برمی‌گرداند، حتی اگر فراخوان یک سرآیند باریک‌تر `x-openclaw-scopes` بفرستد.
- حالت‌های HTTP با هویت مورد اعتماد (برای مثال احراز هویت پراکسی مورد اعتماد یا `gateway.auth.mode="none"`) در صورت وجود `x-openclaw-scopes` به آن احترام می‌گذارند و در غیر این صورت به مجموعهٔ محدودهٔ پیش‌فرض عادی اپراتور برمی‌گردند.
- اگر سیاست عامل هدف ابزارهای حساس را مجاز کند، این نقطهٔ پایانی می‌تواند از آن‌ها استفاده کند.
- این نقطهٔ پایانی را فقط روی loopback/tailnet/ورودی خصوصی نگه دارید؛ آن را مستقیماً در معرض اینترنت عمومی قرار ندهید.

ماتریس احراز هویت:

- `gateway.auth.mode="token"` یا `"password"` + `Authorization: Bearer ...`
  - مالکیت راز مشترک اپراتور Gateway را اثبات می‌کند
  - `x-openclaw-scopes` باریک‌تر را نادیده می‌گیرد
  - مجموعهٔ کامل محدودهٔ پیش‌فرض اپراتور را برمی‌گرداند:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - نوبت‌های گفتگو روی این نقطهٔ پایانی را به‌عنوان نوبت‌های فرستندهٔ مالک تلقی می‌کند
- حالت‌های HTTP با هویت مورد اعتماد (برای مثال احراز هویت پراکسی مورد اعتماد، یا `gateway.auth.mode="none"` روی ورودی خصوصی)
  - یک هویت مورد اعتماد بیرونی یا مرز استقرار را احراز می‌کنند
  - وقتی سرآیند وجود داشته باشد به `x-openclaw-scopes` احترام می‌گذارند
  - وقتی سرآیند وجود نداشته باشد به مجموعهٔ محدودهٔ پیش‌فرض عادی اپراتور برمی‌گردند
  - فقط زمانی معنای مالک را از دست می‌دهند که فراخوان صراحتاً محدوده‌ها را باریک کند و `operator.admin` را حذف کند
  - برای کنترل‌های درخواست در سطح مالک مانند `x-openclaw-model` به `operator.admin` نیاز دارند

[امنیت](/fa/gateway/security) و [دسترسی راه‌دور](/fa/gateway/remote) را ببینید.

## چه زمانی از این نقطهٔ پایانی استفاده کنید

وقتی ابزارسازی یا یک بک‌اند سمت برنامهٔ مورد اعتماد را با یک Gateway موجود یکپارچه می‌کنید و می‌توانید اعتبارنامه‌های اپراتور Gateway را با امنیت نگه دارید، از `/v1/chat/completions` استفاده کنید.

- وقتی یکپارچه‌سازی شما فقط یک سطح اپراتور/کلاینت دیگر برای همان Gateway است، این را به افزودن یک کانال داخلی جدید ترجیح دهید.
- برای کلاینت‌های موبایل بومی که مستقیماً به یک Gateway راه‌دور وصل می‌شوند، [WebChat](/fa/web/webchat) یا [پروتکل Gateway](/fa/gateway/protocol) را ترجیح دهید و جریان راه‌اندازی دستگاه جفت‌شده/توکن دستگاه را پیاده‌سازی کنید تا دستگاه به توکن/گذرواژهٔ HTTP مشترک نیاز نداشته باشد.
- وقتی یک شبکهٔ پیام‌رسانی خارجی را با کاربران، اتاق‌ها، تحویل Webhook، یا انتقال خروجی خودش یکپارچه می‌کنید، به‌جای آن یک Plugin کانال بسازید. [ساخت Pluginها](/fa/plugins/building-plugins) را ببینید.

## قرارداد مدل عامل‌محور

OpenClaw فیلد `model` در OpenAI را به‌عنوان **هدف عامل** در نظر می‌گیرد، نه شناسهٔ خام مدل ارائه‌دهنده.

- `model: "openclaw"` به عامل پیش‌فرض پیکربندی‌شده مسیریابی می‌شود.
- `model: "openclaw/default"` نیز به عامل پیش‌فرض پیکربندی‌شده مسیریابی می‌شود.
- `model: "openclaw/<agentId>"` به یک عامل مشخص مسیریابی می‌شود.

سرآیندهای اختیاری درخواست:

- `x-openclaw-model: <provider/model-or-bare-id>` مدل بک‌اند را برای عامل انتخاب‌شده بازنویسی می‌کند. فراخوان‌های bearer با راز مشترک می‌توانند از این سرآیند استفاده کنند. فراخوان‌های دارای هویت، مانند trusted-proxy یا درخواست‌های ورودی خصوصی بدون احراز هویت همراه با `x-openclaw-scopes`، به `operator.admin` نیاز دارند؛ فراخوان‌های فقط-نوشتن `403 missing scope: operator.admin` می‌گیرند.
- `x-openclaw-agent-id: <agentId>` همچنان به‌عنوان بازنویسی سازگاری پشتیبانی می‌شود.
- `x-openclaw-session-key: <sessionKey>` مسیریابی نشست را صراحتاً کنترل می‌کند. مقدار نباید از فضای نام‌های داخلی رزروشده مانند `subagent:`،‏ `cron:`، یا `acp:` استفاده کند؛ این درخواست‌ها با `400 invalid_request_error` رد می‌شوند.
- `x-openclaw-message-channel: <channel>` زمینهٔ کانال ورودی مصنوعی را برای اعلان‌ها و سیاست‌های آگاه به کانال تنظیم می‌کند.

نام‌های مستعار سازگاری که همچنان پذیرفته می‌شوند:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## فعال‌سازی نقطهٔ پایانی

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

## غیرفعال‌سازی نقطهٔ پایانی

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

به‌طور پیش‌فرض این نقطهٔ پایانی **برای هر درخواست بدون حالت** است (در هر فراخوان یک کلید نشست جدید تولید می‌شود).

اگر درخواست شامل یک رشتهٔ `user` از OpenAI باشد، Gateway از آن یک کلید نشست پایدار استخراج می‌کند، بنابراین فراخوان‌های تکراری می‌توانند یک نشست عامل را به اشتراک بگذارند.

برای برنامه‌های سفارشی، امن‌ترین پیش‌فرض این است که برای هر رشتهٔ گفت‌وگو همان مقدار `user` را دوباره استفاده کنید. از شناسه‌های سطح حساب پرهیز کنید، مگر اینکه صراحتاً بخواهید چند گفت‌وگو یا دستگاه یک نشست OpenClaw را به اشتراک بگذارند. از `x-openclaw-session-key` فقط زمانی استفاده کنید که به کنترل مسیریابی صریح بین چند کلاینت یا رشته نیاز دارید، و کلیدهای متعلق به برنامه را انتخاب کنید که با فضای نام‌های داخلی رزروشده مانند `subagent:`،‏ `cron:`، یا `acp:` شروع نشوند.

## چرا این سطح مهم است

این مجموعهٔ سازگاری، پربازده‌ترین مجموعه برای فرانت‌اندها و ابزارسازی خودمیزبان است:

- بیشتر راه‌اندازی‌های Open WebUI، LobeChat، و LibreChat انتظار `/v1/models` را دارند.
- بسیاری از سامانه‌های RAG انتظار `/v1/embeddings` را دارند.
- کلاینت‌های گفتگوی موجود OpenAI معمولاً می‌توانند با `/v1/chat/completions` شروع کنند.
- کلاینت‌های عامل‌بومی‌تر به‌طور فزاینده‌ای `/v1/responses` را ترجیح می‌دهند.

## فهرست مدل و مسیریابی عامل

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    یک فهرست هدف-عامل OpenClaw.

    شناسه‌های برگشتی، ورودی‌های `openclaw`،‏ `openclaw/default`، و `openclaw/<agentId>` هستند.
    از آن‌ها مستقیماً به‌عنوان مقادیر `model` در OpenAI استفاده کنید.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    هدف‌های عامل سطح بالا را فهرست می‌کند، نه مدل‌های ارائه‌دهندهٔ بک‌اند و نه زیرعامل‌ها.

    زیرعامل‌ها توپولوژی اجرای داخلی باقی می‌مانند. آن‌ها به‌صورت شبه‌مدل ظاهر نمی‌شوند.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` نام مستعار پایدار برای عامل پیش‌فرض پیکربندی‌شده است.

    یعنی کلاینت‌ها می‌توانند حتی اگر شناسهٔ واقعی عامل پیش‌فرض بین محیط‌ها تغییر کند، همچنان از یک شناسهٔ قابل پیش‌بینی استفاده کنند.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    از `x-openclaw-model` استفاده کنید. این یک بازنویسی در سطح مالک است: با مسیر توکن/گذرواژهٔ bearer با راز مشترک Gateway کار می‌کند، و روی مسیرهای HTTP دارای هویت مانند احراز هویت پراکسی مورد اعتماد به `operator.admin` نیاز دارد.

    مثال‌ها:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    اگر آن را حذف کنید، عامل انتخاب‌شده با انتخاب مدل عادی پیکربندی‌شدهٔ خود اجرا می‌شود.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` از همان شناسه‌های `model` هدف-عامل استفاده می‌کند.

    از `model: "openclaw/default"` یا `model: "openclaw/<agentId>"` استفاده کنید.
    وقتی به یک مدل embedding مشخص نیاز دارید، آن را از طرف یک فراخوان با راز مشترک یا یک فراخوان دارای هویت با `operator.admin` در `x-openclaw-model` بفرستید.
    بدون آن سرآیند، درخواست به تنظیم embedding عادی عامل انتخاب‌شده منتقل می‌شود.

  </Accordion>
</AccordionGroup>

## جریان‌دهی (SSE)

برای دریافت Server-Sent Events (SSE)، `stream: true` را تنظیم کنید:

- `Content-Type: text/event-stream`
- هر خط رویداد `data: <json>` است
- جریان با `data: [DONE]` پایان می‌یابد

## قرارداد ابزار گفتگو

`/v1/chat/completions` از زیرمجموعه‌ای از ابزارهای تابعی سازگار با کلاینت‌های رایج OpenAI Chat پشتیبانی می‌کند.

### فیلدهای پشتیبانی‌شدهٔ درخواست

- `tools`: آرایه‌ای از `{ "type": "function", "function": { ... } }`
- `tool_choice`:‏ `"auto"`،‏ `"none"`،‏ `"required"`، یا `{ "type": "function", "function": { "name": "..." } }`
- `messages[*].role: "tool"` نوبت‌های پیگیری
- `messages[*].tool_call_id` برای اتصال نتایج ابزار به فراخوان ابزار قبلی
- `max_completion_tokens`: عدد؛ سقف هر فراخوان برای کل توکن‌های تکمیل (شامل توکن‌های استدلال). نام فیلد فعلی OpenAI Chat Completions؛ وقتی هر دو `max_completion_tokens` و `max_tokens` فرستاده شوند، ترجیح داده می‌شود.
- `max_tokens`: عدد؛ نام مستعار قدیمی که برای سازگاری عقب‌رو پذیرفته می‌شود. وقتی `max_completion_tokens` نیز وجود داشته باشد نادیده گرفته می‌شود.
- `temperature`: عدد؛ دمای نمونه‌گیری best-effort که از طریق کانال stream-param عامل به ارائه‌دهندهٔ بالادستی ارسال می‌شود.
- `top_p`: عدد؛ نمونه‌گیری nucleus به‌صورت best-effort که از طریق کانال stream-param عامل به ارائه‌دهندهٔ بالادستی ارسال می‌شود.
- `frequency_penalty`: عدد؛ جریمهٔ بسامد best-effort که از طریق کانال stream-param عامل به ارائه‌دهندهٔ بالادستی ارسال می‌شود. بازهٔ اعتبارسنجی‌شده: -2.0 تا 2.0. برای مقادیر خارج از بازه، `400 invalid_request_error` برمی‌گرداند.
- `presence_penalty`: عدد؛ جریمهٔ حضور best-effort که از طریق کانال stream-param عامل به ارائه‌دهندهٔ بالادستی ارسال می‌شود. بازهٔ اعتبارسنجی‌شده: -2.0 تا 2.0. برای مقادیر خارج از بازه، `400 invalid_request_error` برمی‌گرداند.
- `seed`: عدد (صحیح)؛ seed به‌صورت best-effort که از طریق کانال stream-param عامل به ارائه‌دهندهٔ بالادستی ارسال می‌شود. برای مقادیر غیرصحیح، `400 invalid_request_error` برمی‌گرداند.
- `stop`: رشته یا آرایه‌ای شامل حداکثر 4 رشته؛ توالی‌های توقف best-effort که از طریق کانال stream-param عامل به ارائه‌دهندهٔ بالادستی ارسال می‌شوند. برای بیش از 4 توالی یا ورودی‌های غیررشته‌ای/خالی، `400 invalid_request_error` برمی‌گرداند.

وقتی هرکدام از فیلدهای سقف توکن تنظیم شود، مقدار از طریق کانال stream-param عامل به ارائه‌دهنده بالادستی فرستاده می‌شود. نام واقعی فیلد wire که به ارائه‌دهنده بالادستی ارسال می‌شود توسط ترابری ارائه‌دهنده انتخاب می‌شود: `max_completion_tokens` برای endpointهای خانواده OpenAI، و `max_tokens` برای ارائه‌دهندگانی که فقط نام قدیمی را می‌پذیرند (مانند Mistral و Chutes). فیلدهای نمونه‌برداری (`temperature`, `top_p`, `frequency_penalty`, `presence_penalty`, `seed`) از همان کانال stream-param پیروی می‌کنند؛ بک‌اند Codex Responses مبتنی بر ChatGPT آن‌ها را در سمت سرور حذف می‌کند، چون از نمونه‌برداری ثابت استفاده می‌کند. `stop` نیز از کانال stream-param عبور می‌کند و به فیلد توقف ترابری نگاشت می‌شود (`stop` برای بک‌اندهای Chat Completions، و `stop_sequences` برای Anthropic)؛ OpenAI Responses API پارامتر توقف ندارد، بنابراین `stop` روی مدل‌های مبتنی بر Responses اعمال نمی‌شود.

### گونه‌های پشتیبانی‌نشده

endpoint برای گونه‌های ابزار پشتیبانی‌نشده، از جمله موارد زیر، `400 invalid_request_error` برمی‌گرداند:

- `tools` غیرآرایه‌ای
- ورودی‌های ابزار غیرتابعی
- نبودن `tool.function.name`
- گونه‌های `tool_choice` مانند `allowed_tools` و `custom`
- مقدارهای `tool_choice.function.name` که با `tools` ارائه‌شده مطابقت ندارند

برای `tool_choice: "required"` و `tool_choice` سنجاق‌شده به تابع، endpoint مجموعه ابزارهای تابعی کلاینتِ در معرض دید را محدود می‌کند، به runtime دستور می‌دهد پیش از پاسخ‌دادن یک ابزار کلاینت را فراخوانی کند، و اگر پاسخ عامل شامل فراخوانی ساخت‌یافته ابزار کلاینتِ منطبق نباشد، خطا برمی‌گرداند. این قرارداد روی فهرست HTTP `tools` ارائه‌شده توسط فراخواننده اعمال می‌شود، نه روی همه ابزارهای داخلی عامل OpenClaw.

### شکل پاسخ ابزار غیرجریانی

وقتی عامل تصمیم می‌گیرد ابزارها را فراخوانی کند، پاسخ از این شکل استفاده می‌کند:

- ورودی‌های `choices[0].finish_reason = "tool_calls"`
- `choices[0].message.tool_calls[]` با:
  - `id`
  - `type: "function"`
  - `function.name`
  - `function.arguments` (رشته JSON)

توضیحات دستیار پیش از فراخوانی ابزار در `choices[0].message.content` برگردانده می‌شود (ممکن است خالی باشد).

### شکل پاسخ ابزار جریانی

وقتی `stream: true` باشد، فراخوانی‌های ابزار به‌صورت قطعه‌های افزایشی SSE منتشر می‌شوند:

- دلتای اولیه نقش دستیار
- دلتاهای اختیاری توضیحات دستیار
- یک یا چند قطعه `delta.tool_calls` که هویت ابزار و بخش‌های آرگومان را حمل می‌کنند
- قطعه نهایی با `finish_reason: "tool_calls"`
- `data: [DONE]`

اگر `stream_options.include_usage=true` باشد، یک قطعه مصرف پایانی پیش از `[DONE]` منتشر می‌شود.

### حلقه پیگیری ابزار

پس از دریافت `tool_calls`، کلاینت باید تابع‌های درخواستی را اجرا کند و یک درخواست پیگیری بفرستد که شامل موارد زیر باشد:

- پیام قبلی فراخوانی ابزار دستیار
- یک یا چند پیام `role: "tool"` با `tool_call_id` منطبق

این کار به اجرای عامل Gateway اجازه می‌دهد همان حلقه استدلال را ادامه دهد و پاسخ نهایی دستیار را تولید کند.

## راه‌اندازی سریع Open WebUI

برای یک اتصال پایه Open WebUI:

- URL پایه: `http://127.0.0.1:18789/v1`
- URL پایه Docker روی macOS: `http://host.docker.internal:18789/v1`
- کلید API: توکن حامل Gateway شما
- مدل: `openclaw/default`

رفتار مورد انتظار:

- `GET /v1/models` باید `openclaw/default` را فهرست کند
- Open WebUI باید از `openclaw/default` به‌عنوان شناسه مدل چت استفاده کند
- اگر برای آن عامل یک ارائه‌دهنده/مدل بک‌اند مشخص می‌خواهید، مدل پیش‌فرض عادی عامل را تنظیم کنید یا `x-openclaw-model` را از یک فراخواننده با راز مشترک یا فراخواننده دارای هویت با `operator.admin` بفرستید

آزمون سریع:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

اگر این فرمان `openclaw/default` را برگرداند، بیشتر راه‌اندازی‌های Open WebUI می‌توانند با همان URL پایه و توکن متصل شوند.

## نمونه‌ها

نشست پایدار برای یک مکالمه برنامه:

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

برای ادامه همان نشست عامل در آن مکالمه، در فراخوانی‌های بعدی از همان مقدار `user` استفاده کنید.

غیرجریانی:

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

فهرست مدل‌ها:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

دریافت یک مدل:

```bash
curl -sS http://127.0.0.1:18789/v1/models/openclaw%2Fdefault \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

ایجاد embeddingها:

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

یادداشت‌ها:

- `/v1/models` هدف‌های عامل OpenClaw را برمی‌گرداند، نه کاتالوگ‌های خام ارائه‌دهنده.
- `openclaw/default` همیشه وجود دارد تا یک شناسه پایدار در همه محیط‌ها کار کند.
- بازنویسی‌های ارائه‌دهنده/مدل بک‌اند در `x-openclaw-model` قرار می‌گیرند، نه در فیلد OpenAI `model`. در مسیرهای احراز هویت HTTP دارای هویت، این سربرگ به `operator.admin` نیاز دارد.
- `/v1/embeddings` از `input` به‌صورت رشته یا آرایه‌ای از رشته‌ها پشتیبانی می‌کند.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [OpenAI](/fa/providers/openai)
