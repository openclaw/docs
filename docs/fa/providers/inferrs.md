---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی inferrs اجرا کنید
    - شما Gemma یا مدل دیگری را از طریق inferrs ارائه می‌کنید
    - برای inferrs به پرچم‌های سازگاری دقیق OpenClaw نیاز دارید
summary: اجرای OpenClaw از طریق inferrs (سرور محلی سازگار با OpenAI)
title: استنباط می‌کند
x-i18n:
    generated_at: "2026-07-12T10:41:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b9b6fe337a2ec6536332dd62840052fd802fad0a5f3d885ce137523266ff3c9
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) مدل‌های محلی را پشت یک API سازگار با OpenAI در مسیر `/v1` ارائه می‌کند. OpenClaw از طریق آداپتور عمومی `openai-completions` با آن ارتباط برقرار می‌کند.

| ویژگی                 | مقدار                                                                           |
| --------------------- | ------------------------------------------------------------------------------- |
| شناسه ارائه‌دهنده     | `inferrs` (سفارشی؛ در `models.providers.inferrs` پیکربندی کنید)                  |
| Plugin                | ندارد — یک Plugin ارائه‌دهنده همراه OpenClaw نیست                               |
| متغیر محیطی احراز هویت | لازم نیست؛ اگر سرور inferrs شما احراز هویت نداشته باشد، هر مقداری قابل استفاده است |
| API                   | سازگار با OpenAI (`openai-completions`)                                         |
| نشانی پایه پیشنهادی   | `http://127.0.0.1:8080/v1` (یا هر جایی که سرور inferrs شما گوش می‌دهد)           |

<Note>
  `inferrs` یک بک‌اند سفارشی، خودمیزبان و سازگار با OpenAI است، نه یک Plugin اختصاصی ارائه‌دهنده OpenClaw: به‌جای انتخاب یک گزینه احراز هویت در راه‌اندازی اولیه، آن را در `models.providers.inferrs` پیکربندی می‌کنید. برای یک Plugin همراه با کشف خودکار، به [SGLang](/fa/providers/sglang) یا [vLLM](/fa/providers/vllm) مراجعه کنید.
</Note>

## شروع به کار

<Steps>
  <Step title="Start inferrs with a model">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="Verify the server is reachable">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="Add an OpenClaw provider entry">
    یک ورودی صریح برای ارائه‌دهنده اضافه کنید و مدل پیش‌فرض خود را به آن ارجاع دهید. نمونه پیکربندی زیر را ببینید.
  </Step>
</Steps>

## نمونه کامل پیکربندی

Gemma 4 روی یک سرور محلی `inferrs`:

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

## راه‌اندازی هنگام نیاز

OpenClaw فقط زمانی می‌تواند `inferrs` را خودش راه‌اندازی کند که یک مدل `inferrs/...` انتخاب شده باشد. `localService` را به همان ورودی ارائه‌دهنده اضافه کنید:

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

`command` باید یک مسیر مطلق باشد. روی میزبان Gateway دستور `which inferrs` را اجرا کنید و از همان مسیر استفاده کنید. مرجع کامل فیلدها: [سرویس‌های مدل محلی](/fa/gateway/local-model-services).

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Why requiresStringContent matters">
    برخی مسیرهای Chat Completions در `inferrs` فقط مقدار رشته‌ای برای `messages[].content` می‌پذیرند، نه آرایه‌های ساختاریافته از بخش‌های محتوا.

    <Warning>
    اگر اجرای OpenClaw با خطای زیر مواجه شد:

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    در ورودی مدل، `compat.requiresStringContent: true` را تنظیم کنید. سپس OpenClaw پیش از ارسال درخواست، بخش‌های محتوای صرفاً متنی را به رشته‌های ساده تبدیل می‌کند.
    </Warning>

  </Accordion>

  <Accordion title="Gemma and tool-schema caveat">
    برخی ترکیب‌های `inferrs` و Gemma درخواست‌های مستقیم کوچک به `/v1/chat/completions` را می‌پذیرند، اما در نوبت‌های کامل زمان اجرای عامل OpenClaw شکست می‌خورند. ابتدا غیرفعال کردن سطح شِمای ابزار را امتحان کنید:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    این کار فشار پرامپت را روی بک‌اندهای محلی سخت‌گیرتر کاهش می‌دهد. اگر درخواست‌های مستقیم کوچک همچنان کار می‌کنند اما نوبت‌های عادی عامل OpenClaw درون `inferrs` پیوسته از کار می‌افتند، آن را محدودیت بالادستی مدل یا سرور در نظر بگیرید، نه مشکل انتقال در OpenClaw.

  </Accordion>

  <Accordion title="Manual smoke test">
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

    اگر دستور نخست کار می‌کند اما دستور دوم شکست می‌خورد، بخش عیب‌یابی زیر را ببینید.

  </Accordion>

  <Accordion title="Proxy-style behavior">
    چون `inferrs` از آداپتور عمومی `openai-completions` استفاده می‌کند، نه `openai-responses`، شکل‌دهی درخواست‌های مختص OpenAI بومی هرگز اعمال نمی‌شود: هیچ `service_tier`، گزینه `store` مربوط به Responses، راهنمای کش پرامپت یا شکل‌دهی بار سازگاری استدلال OpenAI ارسال نمی‌شود.
  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="curl /v1/models fails">
    `inferrs` در حال اجرا نیست، قابل دسترسی نیست یا به میزبان/درگاهی که پیکربندی کرده‌اید متصل نشده است. تأیید کنید سرور راه‌اندازی شده و روی آن نشانی در حال گوش‌دادن است.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    در ورودی مدل، `compat.requiresStringContent: true` را تنظیم کنید (بخش بالا را ببینید).
  </Accordion>

  <Accordion title="Direct /v1/chat/completions calls pass but openclaw infer model run fails">
    برای غیرفعال کردن سطح شِمای ابزار، `compat.supportsTools: false` را تنظیم کنید (هشدار Gemma در بالا را ببینید).
  </Accordion>

  <Accordion title="inferrs still crashes on larger agent turns">
    اگر خطاهای شِما برطرف شده‌اند اما `inferrs` همچنان در نوبت‌های بزرگ‌تر عامل از کار می‌افتد، آن را محدودیت بالادستی `inferrs` یا مدل در نظر بگیرید. فشار پرامپت را کاهش دهید یا بک‌اند/مدل را تغییر دهید.
  </Accordion>
</AccordionGroup>

<Tip>
برای راهنمایی عمومی، به [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq) مراجعه کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="Local models" href="/fa/gateway/local-models" icon="server">
    اجرای OpenClaw با سرورهای مدل محلی.
  </Card>
  <Card title="Local model services" href="/fa/gateway/local-model-services" icon="play">
    راه‌اندازی سرورهای مدل محلی هنگام نیاز برای ارائه‌دهندگان پیکربندی‌شده.
  </Card>
  <Card title="Gateway troubleshooting" href="/fa/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    عیب‌یابی بک‌اندهای محلی سازگار با OpenAI که بررسی‌های اولیه را با موفقیت می‌گذرانند اما اجرای عامل در آن‌ها شکست می‌خورد.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همه ارائه‌دهندگان، ارجاع‌های مدل و رفتار جابه‌جایی هنگام خرابی.
  </Card>
</CardGroup>
