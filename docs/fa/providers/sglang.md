---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی SGLang اجرا کنید
    - شما نقاط پایانی سازگار با OpenAI در مسیر /v1 را با مدل‌های خودتان می‌خواهید
summary: اجرای OpenClaw با SGLang (سرور خودمیزبان سازگار با OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-07-12T10:41:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 54a7805315a7d65fdd2c7c9b6836aa2faccc88db7802cce0ba8c2d4a1aac9d65
    source_path: providers/sglang.md
    workflow: 16
---

SGLang مدل‌های با وزن‌های باز را از طریق یک API ‏HTTP سازگار با OpenAI ارائه می‌کند. OpenClaw با استفاده از خانواده ارائه‌دهنده `openai-completions` و کشف خودکار مدل‌های موجود، به SGLang متصل می‌شود.

| ویژگی                     | مقدار                                                               |
| ------------------------- | ------------------------------------------------------------------- |
| شناسه ارائه‌دهنده         | `sglang`                                                            |
| Plugin                    | همراه، `enabledByDefault: true`                                     |
| متغیر محیطی احراز هویت    | `SGLANG_API_KEY` (اگر سرور احراز هویت ندارد، هر مقدار غیرخالی)      |
| پرچم راه‌اندازی اولیه     | `--auth-choice sglang`                                              |
| API                       | سازگار با OpenAI (`openai-completions`)                             |
| نشانی پایه پیش‌فرض        | `http://127.0.0.1:30000/v1`                                         |
| جای‌نگهدار مدل پیش‌فرض    | `sglang/Qwen/Qwen3-8B`                                              |
| مصرف در جریان‌سازی        | بله (`supportsStreamingUsage: true`)                                |
| قیمت‌گذاری                | به‌عنوان رایگان خارجی علامت‌گذاری شده (`modelPricing.external: false`) |

هنگامی که با `SGLANG_API_KEY` اعلام مشارکت می‌کنید، OpenClaw مدل‌های موجود را نیز به‌صورت **خودکار** از SGLang کشف می‌کند. اگر یک نشانی پایه سفارشی برای SGLang نیز پیکربندی می‌کنید، برای پویا نگه‌داشتن کشف مدل‌ها از `sglang/*` در `agents.defaults.models` استفاده کنید. بخش [کشف مدل (ارائه‌دهنده ضمنی)](#model-discovery-implicit-provider) را در ادامه ببینید.

## شروع به کار

<Steps>
  <Step title="راه‌اندازی SGLang">
    SGLang را با یک سرور سازگار با OpenAI اجرا کنید. نشانی پایه شما باید
    نقطه‌های پایانی `/v1` را ارائه کند (برای مثال `/v1/models` و `/v1/chat/completions`).
    SGLang معمولاً روی نشانی زیر اجرا می‌شود:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="تنظیم کلید API">
    اگر احراز هویت روی سرور شما پیکربندی نشده باشد، هر مقداری کار می‌کند:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="اجرای راه‌اندازی اولیه یا تنظیم مستقیم مدل">
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

هنگامی که `SGLANG_API_KEY` تنظیم شده است (یا یک نمایه احراز هویت وجود دارد) و
`models.providers.sglang` را تعریف **نکرده‌اید**، OpenClaw درخواست زیر را ارسال می‌کند:

- `GET http://127.0.0.1:30000/v1/models`

و شناسه‌های بازگشتی را به ورودی‌های مدل تبدیل می‌کند.

<Note>
اگر `models.providers.sglang` را به‌صراحت تنظیم کنید، OpenClaw به‌طور پیش‌فرض
از مدل‌های اعلام‌شده شما استفاده می‌کند. وقتی می‌خواهید OpenClaw نقطه پایانی
`/models` ارائه‌دهنده پیکربندی‌شده را واکشی کند و همه مدل‌های اعلام‌شده SGLang
را دربر بگیرد، `"sglang/*": {}` را به `agents.defaults.models` اضافه کنید.
</Note>

## پیکربندی صریح (مدل‌های دستی)

در موارد زیر از پیکربندی صریح استفاده کنید:

- SGLang روی میزبان یا درگاه دیگری اجرا می‌شود.
- می‌خواهید مقادیر `contextWindow` یا `maxTokens` را ثابت کنید.
- سرور شما به یک کلید API واقعی نیاز دارد (یا می‌خواهید سربرگ‌ها را کنترل کنید).

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
  <Accordion title="رفتار مشابه پراکسی">
    با SGLang به‌عنوان یک بک‌اند `/v1` سازگار با OpenAI و مشابه پراکسی رفتار
    می‌شود، نه یک نقطه پایانی بومی OpenAI.

    | رفتار | SGLang |
    |-------|--------|
    | شکل‌دهی درخواست مختص OpenAI | اعمال نمی‌شود |
    | `service_tier`، گزینه `store` در Responses و راهنمایی‌های کش فرمان | ارسال نمی‌شوند |
    | شکل‌دهی محموله سازگاری با استدلال | اعمال نمی‌شود |
    | سربرگ‌های انتساب پنهان (`originator`، `version`، `User-Agent`) | در نشانی‌های پایه سفارشی SGLang تزریق نمی‌شوند |

  </Accordion>

  <Accordion title="عیب‌یابی">
    **سرور قابل دسترسی نیست**

    بررسی کنید که سرور در حال اجرا و پاسخ‌گویی است:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **خطاهای احراز هویت**

    اگر درخواست‌ها با خطاهای احراز هویت ناموفق می‌شوند، یک `SGLANG_API_KEY`
    واقعی و منطبق با پیکربندی سرور خود تنظیم کنید، یا ارائه‌دهنده را به‌صراحت
    در `models.providers.sglang` پیکربندی کنید.

    <Tip>
    اگر SGLang را بدون احراز هویت اجرا می‌کنید، هر مقدار غیرخالی برای
    `SGLANG_API_KEY` جهت اعلام مشارکت در کشف مدل کافی است.
    </Tip>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی، شامل ورودی‌های ارائه‌دهنده.
  </Card>
</CardGroup>
