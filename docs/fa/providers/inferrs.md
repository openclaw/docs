---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی inferrs اجرا کنید
    - شما Gemma یا مدل دیگری را از طریق inferrs سرو می‌کنید
    - برای inferrs به پرچم‌های سازگاری دقیق OpenClaw نیاز دارید
summary: اجرای OpenClaw از طریق inferrs (سرور محلی سازگار با OpenAI)
title: استنتاج می‌کند
x-i18n:
    generated_at: "2026-04-29T23:26:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53547c48febe584cf818507b0bf879db0471c575fa8a3ebfec64c658a7090675
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) می‌تواند مدل‌های محلی را پشت یک API سازگار با OpenAI با مسیر
`/v1` ارائه کند. OpenClaw از طریق مسیر عمومی
`openai-completions` با `inferrs` کار می‌کند.

در حال حاضر بهتر است `inferrs` را به‌عنوان یک backend سازگار با OpenAI و خودمیزبان سفارشی در نظر بگیرید، نه یک Plugin ارائه‌دهنده اختصاصی OpenClaw.

## شروع به کار

<Steps>
  <Step title="شروع inferrs با یک مدل">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="بررسی اینکه سرور در دسترس است">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="افزودن یک ورودی ارائه‌دهنده OpenClaw">
    یک ورودی ارائه‌دهنده صریح اضافه کنید و مدل پیش‌فرض خود را به آن اشاره دهید. نمونه کامل پیکربندی را در پایین ببینید.
  </Step>
</Steps>

## نمونه کامل پیکربندی

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

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="چرا requiresStringContent مهم است">
    بعضی از مسیرهای Chat Completions در `inferrs` فقط
    `messages[].content` رشته‌ای را می‌پذیرند، نه آرایه‌های ساختاریافته بخش‌های محتوا.

    <Warning>
    اگر اجراهای OpenClaw با خطایی مانند این شکست خوردند:

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

    OpenClaw پیش از ارسال درخواست، بخش‌های محتوای فقط‌متنی را به رشته‌های ساده تبدیل می‌کند.

  </Accordion>

  <Accordion title="نکته احتیاطی درباره Gemma و طرح‌واره ابزار">
    بعضی از ترکیب‌های فعلی `inferrs` + Gemma درخواست‌های مستقیم و کوچک
    `/v1/chat/completions` را می‌پذیرند، اما همچنان در نوبت‌های کامل زمان اجرای عامل OpenClaw شکست می‌خورند.

    اگر این اتفاق افتاد، ابتدا این را امتحان کنید:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    این کار سطح طرح‌واره ابزار OpenClaw را برای مدل غیرفعال می‌کند و می‌تواند فشار prompt را روی backendهای محلی سخت‌گیرتر کاهش دهد.

    اگر درخواست‌های مستقیم بسیار کوچک همچنان کار می‌کنند اما نوبت‌های عادی عامل OpenClaw همچنان داخل `inferrs` خراب می‌شوند، مشکل باقی‌مانده معمولا به رفتار upstream مدل/سرور مربوط است، نه لایه انتقال OpenClaw.

  </Accordion>

  <Accordion title="آزمون smoke دستی">
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

    اگر فرمان اول کار می‌کند اما دومی شکست می‌خورد، بخش عیب‌یابی زیر را بررسی کنید.

  </Accordion>

  <Accordion title="رفتار به سبک پروکسی">
    `inferrs` به‌عنوان یک backend سازگار با OpenAI با مسیر `/v1` و به سبک پروکسی در نظر گرفته می‌شود، نه یک endpoint بومی OpenAI.

    - شکل‌دهی درخواست‌های مخصوص OpenAI بومی در اینجا اعمال نمی‌شود
    - نه `service_tier`، نه Responses `store`، نه راهنماهای prompt-cache، و نه شکل‌دهی payload سازگار با استدلال OpenAI وجود دارد
    - headerهای انتساب پنهان OpenClaw (`originator`, `version`, `User-Agent`)
      روی URLهای پایه سفارشی `inferrs` تزریق نمی‌شوند

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="curl /v1/models شکست می‌خورد">
    `inferrs` اجرا نشده، در دسترس نیست، یا به میزبان/پورت مورد انتظار bind نشده است. مطمئن شوید سرور شروع شده و روی آدرسی که پیکربندی کرده‌اید در حال گوش‌دادن است.
  </Accordion>

  <Accordion title="messages[].content انتظار یک رشته را دارد">
    در ورودی مدل، `compat.requiresStringContent: true` را تنظیم کنید. برای جزئیات، بخش
    `requiresStringContent` بالا را ببینید.
  </Accordion>

  <Accordion title="فراخوانی‌های مستقیم /v1/chat/completions موفق می‌شوند اما openclaw infer model run شکست می‌خورد">
    برای غیرفعال کردن سطح طرح‌واره ابزار، `compat.supportsTools: false` را تنظیم کنید.
    نکته احتیاطی طرح‌واره ابزار Gemma را در بالا ببینید.
  </Accordion>

  <Accordion title="inferrs همچنان در نوبت‌های بزرگ‌تر عامل خراب می‌شود">
    اگر OpenClaw دیگر خطاهای طرح‌واره دریافت نمی‌کند اما `inferrs` همچنان در نوبت‌های بزرگ‌تر عامل خراب می‌شود، آن را به‌عنوان محدودیت upstream مربوط به `inferrs` یا مدل در نظر بگیرید. فشار prompt را کاهش دهید یا به یک backend یا مدل محلی دیگر تغییر دهید.
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
  <Card title="عیب‌یابی Gateway" href="/fa/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    اشکال‌زدایی backendهای محلی سازگار با OpenAI که probeها را با موفقیت می‌گذرانند اما اجراهای عامل در آن‌ها شکست می‌خورد.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همه ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
</CardGroup>
