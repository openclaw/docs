---
read_when:
    - یکپارچه‌سازی ابزارهایی که انتظار OpenAI Chat Completions را دارند
summary: از Gateway یک نقطهٔ پایانی HTTP سازگار با OpenAI در مسیر /v1/chat/completions ارائه کنید
title: تکمیل‌های گفت‌وگوی OpenAI
x-i18n:
    generated_at: "2026-05-06T09:18:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8cd0995cf5f897ae8f99f35fc4b8ea28ebde3cba41da0f3e768ec1de7874b2f2
    source_path: gateway/openai-http-api.md
    workflow: 16
---

OpenClaw's Gateway می‌تواند یک endpoint کوچک Chat Completions سازگار با OpenAI ارائه کند.

این endpoint به‌صورت **پیش‌فرض غیرفعال است**. ابتدا آن را در پیکربندی فعال کنید.

- `POST /v1/chat/completions`
- همان پورت Gateway (چندبخشی WS + HTTP): `http://<gateway-host>:<port>/v1/chat/completions`

وقتی سطح HTTP سازگار با OpenAI در Gateway فعال باشد، موارد زیر را نیز ارائه می‌کند:

- `GET /v1/models`
- `GET /v1/models/{id}`
- `POST /v1/embeddings`
- `POST /v1/responses`

در پشت صحنه، درخواست‌ها مثل یک اجرای عادی عامل Gateway اجرا می‌شوند (همان مسیر کد `openclaw agent`)، بنابراین مسیریابی/مجوزها/پیکربندی با Gateway شما مطابقت دارد.

## احراز هویت

از پیکربندی احراز هویت Gateway استفاده می‌کند.

مسیرهای رایج احراز هویت HTTP:

- احراز هویت با راز مشترک (`gateway.auth.mode="token"` یا `"password"`):
  `Authorization: Bearer <token-or-password>`
- احراز هویت HTTP حامل هویتِ مورد اعتماد (`gateway.auth.mode="trusted-proxy"`):
  از مسیر پراکسی پیکربندی‌شده و آگاه از هویت عبور دهید و اجازه دهید headerهای
  هویتی لازم را تزریق کند
- احراز هویت باز برای ورودی خصوصی (`gateway.auth.mode="none"`):
  هیچ header احراز هویتی لازم نیست

نکته‌ها:

- وقتی `gateway.auth.mode="token"` است، از `gateway.auth.token` (یا `OPENCLAW_GATEWAY_TOKEN`) استفاده کنید.
- وقتی `gateway.auth.mode="password"` است، از `gateway.auth.password` (یا `OPENCLAW_GATEWAY_PASSWORD`) استفاده کنید.
- وقتی `gateway.auth.mode="trusted-proxy"` است، درخواست HTTP باید از یک
  منبع پراکسی مورد اعتماد پیکربندی‌شده بیاید؛ پراکسی‌های loopback هم‌میزبان نیازمند تنظیم صریح
  `gateway.auth.trustedProxy.allowLoopback = true` هستند.
- اگر `gateway.auth.rateLimit` پیکربندی شده باشد و خطاهای احراز هویت بیش از حد رخ دهند، endpoint مقدار `429` را با `Retry-After` برمی‌گرداند.

## مرز امنیتی (مهم)

با این endpoint مانند یک سطح **دسترسی کامل اپراتور** برای نمونه Gateway برخورد کنید.

- احراز هویت bearer در HTTP اینجا یک مدل محدوده محدود برای هر کاربر نیست.
- token/password معتبر Gateway برای این endpoint باید مانند اعتبارنامه مالک/اپراتور تلقی شود.
- درخواست‌ها از همان مسیر عامل control-plane مثل اقدام‌های اپراتور مورد اعتماد عبور می‌کنند.
- برای این endpoint مرز ابزار جداگانه غیرمالک/برای هر کاربر وجود ندارد؛ وقتی فراخواننده از احراز هویت Gateway اینجا عبور کند، OpenClaw آن فراخواننده را برای این gateway به‌عنوان اپراتور مورد اعتماد تلقی می‌کند.
- برای حالت‌های احراز هویت با راز مشترک (`token` و `password`)، حتی اگر فراخواننده header محدودتر `x-openclaw-scopes` بفرستد، endpoint پیش‌فرض‌های کامل عادی اپراتور را بازیابی می‌کند.
- حالت‌های HTTP حامل هویت مورد اعتماد (برای مثال احراز هویت پراکسی مورد اعتماد یا `gateway.auth.mode="none"`) در صورت وجود `x-openclaw-scopes` آن را رعایت می‌کنند و در غیر این صورت به مجموعه محدوده پیش‌فرض عادی اپراتور برمی‌گردند.
- اگر سیاست عامل هدف ابزارهای حساس را مجاز بداند، این endpoint می‌تواند از آن‌ها استفاده کند.
- این endpoint را فقط روی loopback/tailnet/ورودی خصوصی نگه دارید؛ آن را مستقیما در معرض اینترنت عمومی قرار ندهید.

ماتریس احراز هویت:

- `gateway.auth.mode="token"` یا `"password"` + `Authorization: Bearer ...`
  - مالکیت راز مشترک اپراتور gateway را اثبات می‌کند
  - `x-openclaw-scopes` محدودتر را نادیده می‌گیرد
  - مجموعه محدوده کامل پیش‌فرض اپراتور را بازیابی می‌کند:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - نوبت‌های چت در این endpoint را به‌عنوان نوبت‌های فرستنده-مالک تلقی می‌کند
- حالت‌های HTTP حامل هویت مورد اعتماد (برای مثال احراز هویت پراکسی مورد اعتماد، یا `gateway.auth.mode="none"` روی ورودی خصوصی)
  - یک هویت بیرونی مورد اعتماد یا مرز استقرار را احراز می‌کنند
  - وقتی header وجود داشته باشد، `x-openclaw-scopes` را رعایت می‌کنند
  - وقتی header وجود نداشته باشد، به مجموعه محدوده پیش‌فرض عادی اپراتور برمی‌گردند
  - فقط وقتی معناشناسی مالک را از دست می‌دهند که فراخواننده به‌صراحت محدوده‌ها را محدود کند و `operator.admin` را حذف کند

[امنیت](/fa/gateway/security) و [دسترسی راه‌دور](/fa/gateway/remote) را ببینید.

## قرارداد مدل عامل‌محور

OpenClaw فیلد OpenAI `model` را به‌عنوان **هدف عامل** در نظر می‌گیرد، نه شناسه خام مدل provider.

- `model: "openclaw"` به عامل پیش‌فرض پیکربندی‌شده مسیر می‌دهد.
- `model: "openclaw/default"` نیز به عامل پیش‌فرض پیکربندی‌شده مسیر می‌دهد.
- `model: "openclaw/<agentId>"` به یک عامل مشخص مسیر می‌دهد.

headerهای اختیاری درخواست:

- `x-openclaw-model: <provider/model-or-bare-id>` مدل backend را برای عامل انتخاب‌شده override می‌کند.
- `x-openclaw-agent-id: <agentId>` همچنان به‌عنوان override سازگاری پشتیبانی می‌شود.
- `x-openclaw-session-key: <sessionKey>` مسیریابی session را کاملا کنترل می‌کند.
- `x-openclaw-message-channel: <channel>` زمینه کانال ورودی مصنوعی را برای promptها و سیاست‌های آگاه از کانال تنظیم می‌کند.

نام‌های مستعار سازگاری که همچنان پذیرفته می‌شوند:

- `model: "openclaw:<agentId>"`
- `model: "agent:<agentId>"`

## فعال‌سازی endpoint

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

## غیرفعال‌سازی endpoint

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

## رفتار session

به‌صورت پیش‌فرض، endpoint برای هر درخواست **بدون حالت** است (در هر فراخوانی یک کلید session جدید تولید می‌شود).

اگر درخواست شامل رشته OpenAI `user` باشد، Gateway یک کلید session پایدار از آن استخراج می‌کند، بنابراین فراخوانی‌های تکراری می‌توانند یک session عامل مشترک داشته باشند.

## چرا این سطح اهمیت دارد

این مجموعه سازگاری با بیشترین اهرم برای frontendها و ابزارهای self-hosted است:

- بیشتر تنظیمات Open WebUI، LobeChat، و LibreChat انتظار `/v1/models` را دارند.
- بسیاری از سیستم‌های RAG انتظار `/v1/embeddings` را دارند.
- کلاینت‌های چت موجود OpenAI معمولا می‌توانند با `/v1/chat/completions` شروع کنند.
- کلاینت‌های عامل‌محورتر به‌طور فزاینده‌ای `/v1/responses` را ترجیح می‌دهند.

## فهرست مدل و مسیریابی عامل

<AccordionGroup>
  <Accordion title="What does `/v1/models` return?">
    یک فهرست هدف عامل OpenClaw.

    شناسه‌های برگشتی شامل ورودی‌های `openclaw`، `openclaw/default`، و `openclaw/<agentId>` هستند.
    از آن‌ها مستقیما به‌عنوان مقادیر OpenAI `model` استفاده کنید.

  </Accordion>
  <Accordion title="Does `/v1/models` list agents or sub-agents?">
    هدف‌های عامل سطح بالا را فهرست می‌کند، نه مدل‌های backend provider و نه sub-agentها.

    sub-agentها توپولوژی اجرای داخلی باقی می‌مانند. آن‌ها به‌صورت شبه‌مدل ظاهر نمی‌شوند.

  </Accordion>
  <Accordion title="Why is `openclaw/default` included?">
    `openclaw/default` نام مستعار پایدار برای عامل پیش‌فرض پیکربندی‌شده است.

    یعنی کلاینت‌ها حتی اگر شناسه واقعی عامل پیش‌فرض بین محیط‌ها تغییر کند، می‌توانند همچنان از یک شناسه قابل پیش‌بینی استفاده کنند.

  </Accordion>
  <Accordion title="How do I override the backend model?">
    از `x-openclaw-model` استفاده کنید.

    مثال‌ها:
    `x-openclaw-model: openai/gpt-5.4`
    `x-openclaw-model: gpt-5.5`

    اگر آن را حذف کنید، عامل انتخاب‌شده با انتخاب مدل پیکربندی‌شده عادی خود اجرا می‌شود.

  </Accordion>
  <Accordion title="How do embeddings fit this contract?">
    `/v1/embeddings` از همان شناسه‌های `model` هدف عامل استفاده می‌کند.

    از `model: "openclaw/default"` یا `model: "openclaw/<agentId>"` استفاده کنید.
    وقتی به یک مدل embedding مشخص نیاز دارید، آن را در `x-openclaw-model` بفرستید.
    بدون آن header، درخواست به تنظیمات عادی embedding عامل انتخاب‌شده منتقل می‌شود.

  </Accordion>
</AccordionGroup>

## Streaming (SSE)

برای دریافت Server-Sent Events (SSE)، `stream: true` را تنظیم کنید:

- `Content-Type: text/event-stream`
- هر خط event به‌شکل `data: <json>` است
- Stream با `data: [DONE]` پایان می‌یابد

## راه‌اندازی سریع Open WebUI

برای یک اتصال پایه Open WebUI:

- Base URL: `http://127.0.0.1:18789/v1`
- Base URL در Docker روی macOS: `http://host.docker.internal:18789/v1`
- API key: token bearer Gateway شما
- Model: `openclaw/default`

رفتار مورد انتظار:

- `GET /v1/models` باید `openclaw/default` را فهرست کند
- Open WebUI باید از `openclaw/default` به‌عنوان شناسه مدل چت استفاده کند
- اگر برای آن عامل یک backend provider/model مشخص می‌خواهید، مدل پیش‌فرض عادی عامل را تنظیم کنید یا `x-openclaw-model` را بفرستید

Smoke سریع:

```bash
curl -sS http://127.0.0.1:18789/v1/models \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

اگر این `openclaw/default` را برگرداند، بیشتر تنظیمات Open WebUI می‌توانند با همان base URL و token وصل شوند.

## مثال‌ها

بدون streaming:

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "openclaw/default",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

Streaming:

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

ساخت embeddingها:

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

نکته‌ها:

- `/v1/models` هدف‌های عامل OpenClaw را برمی‌گرداند، نه کاتالوگ‌های خام provider.
- `openclaw/default` همیشه وجود دارد تا یک شناسه پایدار در محیط‌های مختلف کار کند.
- overrideهای backend provider/model باید در `x-openclaw-model` باشند، نه در فیلد OpenAI `model`.
- `/v1/embeddings` از `input` به‌صورت رشته یا آرایه‌ای از رشته‌ها پشتیبانی می‌کند.

## مرتبط

- [مرجع پیکربندی](/fa/gateway/configuration-reference)
- [OpenAI](/fa/providers/openai)
