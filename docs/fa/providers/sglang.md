---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی SGLang اجرا کنید
    - شما نقاط پایانی /v1 سازگار با OpenAI را با مدل‌های خودتان می‌خواهید
summary: اجرای OpenClaw با SGLang (سرور خودمیزبان سازگار با OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-29T23:28:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8ed6767f85bcf099fb25dfe72a48b8a09e04ba13212125651616d2d93607beba
    source_path: providers/sglang.md
    workflow: 16
---

SGLang می‌تواند مدل‌های متن‌باز را از طریق یک API HTTP **سازگار با OpenAI** ارائه کند.
OpenClaw می‌تواند با استفاده از API `openai-completions` به SGLang متصل شود.

OpenClaw همچنین می‌تواند مدل‌های موجود را از SGLang **به‌طور خودکار کشف کند**، وقتی با `SGLANG_API_KEY` فعالش کنید (اگر سرور شما احراز هویت را اعمال نکند، هر مقداری کار می‌کند) و ورودی صریح `models.providers.sglang` تعریف نکرده باشید.

OpenClaw با `sglang` به‌عنوان یک ارائه‌دهنده محلی سازگار با OpenAI رفتار می‌کند که از محاسبه مصرف جریانی پشتیبانی می‌کند، بنابراین شمارش توکن‌های وضعیت/زمینه می‌تواند از پاسخ‌های `stream_options.include_usage` به‌روزرسانی شود.

## شروع به کار

<Steps>
  <Step title="Start SGLang">
    SGLang را با یک سرور سازگار با OpenAI اجرا کنید. URL پایه شما باید endpointهای
    `/v1` را ارائه کند (برای مثال `/v1/models`، `/v1/chat/completions`). SGLang
    معمولاً روی این آدرس اجرا می‌شود:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Set an API key">
    اگر روی سرور شما احراز هویت پیکربندی نشده باشد، هر مقداری کار می‌کند:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Run onboarding or set a model directly">
    ```bash
    openclaw onboard
    ```

    یا مدل را به‌صورت دستی پیکربندی کنید:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## کشف مدل (ارائه‌دهنده ضمنی)

وقتی `SGLANG_API_KEY` تنظیم شده باشد (یا یک پروفایل احراز هویت وجود داشته باشد) و شما **`models.providers.sglang` را تعریف نکرده باشید**، OpenClaw این آدرس را پرس‌وجو می‌کند:

- `GET http://127.0.0.1:30000/v1/models`

و شناسه‌های بازگردانده‌شده را به ورودی‌های مدل تبدیل می‌کند.

<Note>
اگر `models.providers.sglang` را صریحاً تنظیم کنید، کشف خودکار نادیده گرفته می‌شود و
باید مدل‌ها را به‌صورت دستی تعریف کنید.
</Note>

## پیکربندی صریح (مدل‌های دستی)

از پیکربندی صریح زمانی استفاده کنید که:

- SGLang روی میزبان/درگاه متفاوتی اجرا می‌شود.
- می‌خواهید مقادیر `contextWindow`/`maxTokens` را ثابت کنید.
- سرور شما به یک کلید API واقعی نیاز دارد (یا می‌خواهید سرآیندها را کنترل کنید).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Proxy-style behavior">
    با SGLang به‌عنوان یک backend سازگار با `/v1` به سبک پروکسی رفتار می‌شود، نه یک
    endpoint بومی OpenAI.

    | رفتار | SGLang |
    |----------|--------|
    | شکل‌دهی درخواست مخصوص OpenAI | اعمال نمی‌شود |
    | `service_tier`، `store` مربوط به Responses، راهنماهای prompt-cache | ارسال نمی‌شود |
    | شکل‌دهی payload سازگار با reasoning | اعمال نمی‌شود |
    | سرآیندهای انتساب پنهان (`originator`، `version`، `User-Agent`) | روی URLهای پایه سفارشی SGLang تزریق نمی‌شود |

  </Accordion>

  <Accordion title="Troubleshooting">
    **سرور قابل دسترسی نیست**

    بررسی کنید سرور در حال اجراست و پاسخ می‌دهد:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **خطاهای احراز هویت**

    اگر درخواست‌ها با خطاهای احراز هویت شکست می‌خورند، یک `SGLANG_API_KEY` واقعی تنظیم کنید که با پیکربندی سرور شما مطابقت داشته باشد، یا ارائه‌دهنده را به‌صورت صریح زیر
    `models.providers.sglang` پیکربندی کنید.

    <Tip>
    اگر SGLang را بدون احراز هویت اجرا می‌کنید، هر مقدار غیرخالی برای
    `SGLANG_API_KEY` برای فعال‌کردن کشف مدل کافی است.
    </Tip>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    schema کامل config شامل ورودی‌های ارائه‌دهنده.
  </Card>
</CardGroup>
