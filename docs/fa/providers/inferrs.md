---
read_when:
    - می‌خواهید OpenClaw را در برابر یک سرور محلی inferrs اجرا کنید
    - شما Gemma یا مدل دیگری را از طریق inferrs سرو می‌کنید
    - به پرچم‌های سازگاری دقیق OpenClaw برای inferrs نیاز دارید
summary: اجرای OpenClaw از طریق inferrs (سرور محلی سازگار با OpenAI)
title: استنباط می‌کند
x-i18n:
    generated_at: "2026-05-06T09:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 216783689527229835acf4f0fb6d2981d1915bd5df28e631b5384c4cbb9ee158
    source_path: providers/inferrs.md
    workflow: 16
---

[inferrs](https://github.com/ericcurtin/inferrs) می‌تواند مدل‌های محلی را پشت یک API سازگار با OpenAI در مسیر `/v1` ارائه کند. OpenClaw از طریق مسیر عمومی `openai-completions` با `inferrs` کار می‌کند.

| ویژگی | مقدار |
| ------------------ | ------------------------------------------------------------------ |
| شناسهٔ ارائه‌دهنده | `inferrs` (سفارشی؛ زیر `models.providers.inferrs` پیکربندی کنید) |
| Plugin | هیچ‌کدام — `inferrs` یک Plugin ارائه‌دهندهٔ همراه OpenClaw نیست |
| متغیر محیطی احراز هویت | اختیاری. اگر سرور inferrs شما احراز هویت ندارد، هر مقداری کار می‌کند |
| API | سازگار با OpenAI (`openai-completions`) |
| URL پایهٔ پیشنهادی | `http://127.0.0.1:8080/v1` (یا هرجایی که سرور inferrs شما اجرا می‌شود) |

<Note>
  در حال حاضر بهتر است `inferrs` را به‌عنوان یک بک‌اند سازگار با OpenAI، سفارشی و خودمیزبان در نظر بگیرید، نه یک Plugin اختصاصی ارائه‌دهندهٔ OpenClaw. آن را از طریق `models.providers.inferrs` پیکربندی می‌کنید، نه با یک پرچم انتخاب هنگام راه‌اندازی. اگر به یک Plugin همراه واقعی با کشف خودکار نیاز دارید، [SGLang](/fa/providers/sglang) یا [vLLM](/fa/providers/vllm) را ببینید.
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
    یک ورودی صریح برای ارائه‌دهنده اضافه کنید و مدل پیش‌فرض خود را به آن اشاره دهید. نمونهٔ کامل پیکربندی را در پایین ببینید.
  </Step>
</Steps>

## نمونهٔ کامل پیکربندی

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
  <Accordion title="Why requiresStringContent matters">
    برخی مسیرهای Chat Completions در `inferrs` فقط
    `messages[].content` رشته‌ای را می‌پذیرند، نه آرایه‌های ساختاریافتهٔ بخش‌های محتوا.

    <Warning>
    اگر اجرای OpenClaw با خطایی مانند این ناموفق شد:

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

    OpenClaw قبل از ارسال درخواست، بخش‌های محتوای کاملاً متنی را به رشته‌های ساده تبدیل می‌کند.

  </Accordion>

  <Accordion title="Gemma and tool-schema caveat">
    برخی ترکیب‌های فعلی `inferrs` + Gemma درخواست‌های کوچک مستقیم
    `/v1/chat/completions` را می‌پذیرند، اما همچنان در نوبت‌های کامل زمان اجرای عامل OpenClaw ناموفق می‌شوند.

    اگر این اتفاق افتاد، ابتدا این را امتحان کنید:

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    این کار سطح طرح‌وارهٔ ابزار OpenClaw را برای مدل غیرفعال می‌کند و می‌تواند فشار پرامپت را روی بک‌اندهای محلی سخت‌گیرتر کاهش دهد.

    اگر درخواست‌های مستقیم کوچک همچنان کار می‌کنند اما نوبت‌های عادی عامل OpenClaw همچنان داخل `inferrs` خراب می‌شوند، مشکل باقی‌مانده معمولاً به رفتار مدل/سرور بالادستی مربوط است، نه لایهٔ انتقال OpenClaw.

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

    اگر فرمان اول کار می‌کند اما فرمان دوم ناموفق است، بخش عیب‌یابی زیر را بررسی کنید.

  </Accordion>

  <Accordion title="Proxy-style behavior">
    `inferrs` به‌عنوان یک بک‌اند `/v1` سازگار با OpenAI و به سبک پراکسی در نظر گرفته می‌شود، نه یک نقطهٔ پایانی بومی OpenAI.

    - شکل‌دهی درخواست‌های فقط مخصوص OpenAI بومی اینجا اعمال نمی‌شود
    - نه `service_tier`، نه Responses `store`، نه راهنمایی‌های کش پرامپت، و نه شکل‌دهی بارسنج سازگاری استدلال OpenAI وجود دارد
    - سرآیندهای انتساب پنهان OpenClaw (`originator`، `version`، `User-Agent`) روی URLهای پایهٔ سفارشی `inferrs` تزریق نمی‌شوند

  </Accordion>
</AccordionGroup>

## عیب‌یابی

<AccordionGroup>
  <Accordion title="curl /v1/models fails">
    `inferrs` اجرا نیست، در دسترس نیست، یا به میزبان/درگاه مورد انتظار متصل نشده است. مطمئن شوید سرور شروع شده و روی نشانی‌ای که پیکربندی کرده‌اید در حال گوش دادن است.
  </Accordion>

  <Accordion title="messages[].content expected a string">
    در ورودی مدل `compat.requiresStringContent: true` را تنظیم کنید. برای جزئیات، بخش `requiresStringContent` بالا را ببینید.
  </Accordion>

  <Accordion title="Direct /v1/chat/completions calls pass but openclaw infer model run fails">
    برای غیرفعال کردن سطح طرح‌وارهٔ ابزار، تنظیم `compat.supportsTools: false` را امتحان کنید. نکتهٔ احتیاطی طرح‌وارهٔ ابزار Gemma در بالا را ببینید.
  </Accordion>

  <Accordion title="inferrs still crashes on larger agent turns">
    اگر OpenClaw دیگر خطاهای طرح‌واره دریافت نمی‌کند اما `inferrs` همچنان در نوبت‌های بزرگ‌تر عامل خراب می‌شود، آن را به‌عنوان محدودیت بالادستی `inferrs` یا مدل در نظر بگیرید. فشار پرامپت را کاهش دهید یا به بک‌اند یا مدل محلی دیگری تغییر دهید.
  </Accordion>
</AccordionGroup>

<Tip>
برای راهنمایی عمومی، [عیب‌یابی](/fa/help/troubleshooting) و [پرسش‌های متداول](/fa/help/faq) را ببینید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="Local models" href="/fa/gateway/local-models" icon="server">
    اجرای OpenClaw در برابر سرورهای مدل محلی.
  </Card>
  <Card title="Gateway troubleshooting" href="/fa/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    اشکال‌زدایی بک‌اندهای محلی سازگار با OpenAI که بررسی‌های اولیه را پاس می‌کنند اما در اجرای عامل ناموفق می‌شوند.
  </Card>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همهٔ ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
</CardGroup>
