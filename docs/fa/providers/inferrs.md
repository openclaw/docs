---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی inferrs اجرا کنید
    - شما Gemma یا مدل دیگری را از طریق inferrs ارائه می‌کنید
    - به پرچم‌های سازگاری دقیق OpenClaw برای inferrs نیاز دارید
summary: اجرای OpenClaw از طریق inferrs (سرور محلی سازگار با OpenAI)
title: استنباط می‌کند
x-i18n:
    generated_at: "2026-05-10T20:03:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8352da589baaa3a193bb3a56d12ee1a50630346dda186898346e805844d22aa1
    source_path: providers/inferrs.md
    workflow: 16
    postprocess_version: locale-links-v1
---

[inferrs](https://github.com/ericcurtin/inferrs) می‌تواند مدل‌های محلی را پشت یک API سازگار با OpenAI به نام `/v1` ارائه کند. OpenClaw از مسیر عمومی `openai-completions` با `inferrs` کار می‌کند.

| ویژگی              | مقدار                                                              |
| ------------------ | ------------------------------------------------------------------ |
| شناسه ارائه‌دهنده  | `inferrs` (سفارشی؛ زیر `models.providers.inferrs` پیکربندی کنید) |
| Plugin             | هیچ‌کدام — `inferrs` یک provider plugin بسته‌بندی‌شده OpenClaw نیست |
| متغیر محیط احراز هویت | اختیاری. اگر سرور inferrs شما احراز هویت نداشته باشد، هر مقداری کار می‌کند |
| API                | سازگار با OpenAI (`openai-completions`)                           |
| URL پایه پیشنهادی | `http://127.0.0.1:8080/v1` (یا هر جایی که سرور inferrs شما قرار دارد) |

<Note>
  در حال حاضر بهتر است `inferrs` را یک backend سازگار با OpenAI و self-hosted سفارشی در نظر بگیرید، نه یک provider plugin اختصاصی OpenClaw. آن را از طریق `models.providers.inferrs` پیکربندی می‌کنید، نه با یک پرچم انتخاب onboarding. اگر به یک plugin واقعاً بسته‌بندی‌شده با کشف خودکار نیاز دارید، [SGLang](/fa/providers/sglang) یا [vLLM](/fa/providers/vllm) را ببینید.
</Note>

## شروع به کار

<Steps>
  <Step title="اجرای inferrs با یک مدل">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="بررسی دسترس‌پذیر بودن سرور">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="افزودن ورودی provider برای OpenClaw">
    یک ورودی provider صریح اضافه کنید و مدل پیش‌فرض خود را به آن اشاره دهید. نمونه پیکربندی کامل را در پایین ببینید.
  </Step>
</Steps>

## نمونه پیکربندی کامل

این نمونه از Gemma 4 روی یک سرور محلی `inferrs` استفاده می‌کند.

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## راه‌اندازی در زمان نیاز

Inferrs همچنین می‌تواند فقط زمانی توسط OpenClaw راه‌اندازی شود که یک مدل `inferrs/...`
انتخاب شده باشد. `localService` را به همان ورودی provider اضافه کنید:

```json5
{
  models: {
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "/opt/homebrew/bin/inferrs",
          args: [
            "serve",
            "google/gemma-4-E2B-it",
            "--host",
            "127.0.0.1",
            "--port",
            "8080",
            "--device",
            "metal",
          ],
          healthUrl: "http://127.0.0.1:8080/v1/models",
          readyTimeoutMs: 180000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

`command` باید مطلق باشد. روی میزبان Gateway از `which inferrs` استفاده کنید و آن
مسیر را در پیکربندی قرار دهید. برای مرجع کامل فیلدها، [سرویس‌های مدل محلی](/fa/gateway/local-model-services) را ببینید.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="چرا requiresStringContent مهم است">
    برخی مسیرهای Chat Completions در `inferrs` فقط `messages[].content` رشته‌ای را
    می‌پذیرند، نه آرایه‌های ساختاریافته بخش‌های محتوا.

    <Warning>
    اگر اجرای OpenClaw با خطایی مانند این شکست خورد:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    در ورودی مدل خود `compat.requiresStringContent: true` را تنظیم کنید.
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw پیش از ارسال درخواست، بخش‌های محتوای متنی خالص را به رشته‌های ساده
    تبدیل می‌کند.

  </Accordion>

  <Accordion title="نکته احتیاطی درباره Gemma و طرح‌واره ابزار">
    برخی ترکیب‌های فعلی `inferrs` + Gemma درخواست‌های مستقیم کوچک
    `/v1/chat/completions` را می‌پذیرند، اما همچنان در turnهای کامل agent-runtime
    OpenClaw شکست می‌خورند.

    اگر چنین شد، ابتدا این را امتحان کنید:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    این کار سطح طرح‌واره ابزار OpenClaw را برای مدل غیرفعال می‌کند و می‌تواند فشار prompt
    را روی backendهای محلی سخت‌گیرتر کاهش دهد.

    اگر درخواست‌های مستقیم بسیار کوچک همچنان کار می‌کنند اما turnهای عادی agent در OpenClaw
    داخل `inferrs` همچنان crash می‌کنند، مشکل باقی‌مانده معمولاً به رفتار مدل/سرور upstream
    مربوط است، نه لایه انتقال OpenClaw.

  </Accordion>

  <Accordion title="Smoke test دستی">
    پس از پیکربندی، هر دو لایه را آزمایش کنید:

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    اگر فرمان اول کار کرد اما دومی شکست خورد، بخش عیب‌یابی زیر را بررسی کنید.

  </Accordion>

  <Accordion title="رفتار سبک proxy">
    با `inferrs` به‌عنوان یک backend سازگار با OpenAI به سبک proxy برای `/v1` رفتار می‌شود، نه یک
    endpoint بومی OpenAI.

    - شکل‌دهی درخواست مختص OpenAI بومی اینجا اعمال نمی‌شود
    - بدون `service_tier`، بدون Responses `store`، بدون راهنمایی‌های prompt-cache، و بدون
      شکل‌دهی payload سازگاری reasoning برای OpenAI
    - هدرهای انتساب پنهان OpenClaw (`originator`، `version`، `User-Agent`)
      روی URLهای پایه سفارشی `inferrs` تزریق نمی‌شوند

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="curl /v1/models شکست می‌خورد">
    `inferrs` اجرا نشده، در دسترس نیست، یا به host/port مورد انتظار bind نشده است.
    مطمئن شوید سرور راه‌اندازی شده و روی آدرسی که پیکربندی کرده‌اید در حال listen است.
  </Accordion>

  <Accordion title="messages[].content انتظار یک رشته دارد">
    در ورودی مدل `compat.requiresStringContent: true` را تنظیم کنید. برای جزئیات،
    بخش `requiresStringContent` در بالا را ببینید.
  </Accordion>

  <Accordion title="فراخوانی‌های مستقیم /v1/chat/completions موفق می‌شوند اما openclaw infer model run شکست می‌خورد">
    برای غیرفعال کردن سطح طرح‌واره ابزار، `compat.supportsTools: false` را تنظیم کنید.
    نکته احتیاطی طرح‌واره ابزار Gemma را در بالا ببینید.
  </Accordion>

  <Accordion title="inferrs همچنان در turnهای agent بزرگ‌تر crash می‌کند">
    اگر OpenClaw دیگر خطاهای schema دریافت نمی‌کند اما `inferrs` همچنان در turnهای agent بزرگ‌تر
    crash می‌کند، آن را محدودیت upstream در `inferrs` یا مدل در نظر بگیرید. فشار
    prompt را کاهش دهید یا به backend محلی یا مدل متفاوتی تغییر دهید.
  </Accordion>
</AccordionGroup>

<Tip>
برای راهنمایی عمومی، [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq) را ببینید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="مدل‌های محلی" href="/fa/gateway/local-models" icon="server">
    اجرای OpenClaw در برابر سرورهای مدل محلی.
  </Card>
  <Card title="سرویس‌های مدل محلی" href="/fa/gateway/local-model-services" icon="play">
    راه‌اندازی سرورهای مدل محلی در زمان نیاز برای providerهای پیکربندی‌شده.
  </Card>
  <Card title="عیب‌یابی Gateway" href="/fa/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    اشکال‌زدایی backendهای محلی سازگار با OpenAI که probeها را با موفقیت می‌گذرانند اما اجرای agent در آن‌ها شکست می‌خورد.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همه providerها، ارجاع‌های مدل، و رفتار failover.
  </Card>
</CardGroup>
