---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی SGLang اجرا کنید
    - می‌خواهید نقاط پایانی /v1 سازگار با OpenAI را با مدل‌های خودتان داشته باشید
summary: اجرای OpenClaw با SGLang (سرور خودمیزبان سازگار با OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-13T05:34:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: bd1a5954e3994e3640ee17c62acedc314716c3ed5e52528da436c36c077ebead
    source_path: providers/sglang.md
    workflow: 16
---

SGLang مدل‌های open-weight را از طریق یک API HTTP سازگار با OpenAI ارائه می‌کند. OpenClaw با استفاده از خانوادهٔ ارائه‌دهندهٔ `openai-completions` و با کشف خودکار مدل‌های موجود به SGLang متصل می‌شود.

| ویژگی                    | مقدار                                                       |
| ------------------------- | ------------------------------------------------------------ |
| شناسهٔ ارائه‌دهنده        | `sglang`                                                     |
| Plugin                    | همراه، `enabledByDefault: true`                              |
| متغیر محیطی احراز هویت    | `SGLANG_API_KEY` (اگر سرور احراز هویت ندارد، هر مقدار غیرخالی) |
| پرچم راه‌اندازی اولیه     | `--auth-choice sglang`                                       |
| API                       | سازگار با OpenAI (`openai-completions`)                     |
| URL پایهٔ پیش‌فرض         | `http://127.0.0.1:30000/v1`                                  |
| جای‌نگهدار مدل پیش‌فرض    | `sglang/Qwen/Qwen3-8B`                                       |
| مصرف Streaming            | بله (`supportsStreamingUsage: true`)                         |
| قیمت‌گذاری                | به‌عنوان external-free علامت‌گذاری شده است (`modelPricing.external: false`) |

OpenClaw همچنین وقتی با `SGLANG_API_KEY` اعلام آمادگی می‌کنید، مدل‌های موجود را از SGLang **به‌صورت خودکار کشف می‌کند**. وقتی یک URL پایهٔ سفارشی برای SGLang نیز پیکربندی می‌کنید، از `sglang/*` در `agents.defaults.models` استفاده کنید تا کشف مدل پویا بماند. بخش [کشف مدل (ارائه‌دهندهٔ ضمنی)](#model-discovery-implicit-provider) را در پایین ببینید.

## شروع کار

<Steps>
  <Step title="SGLang را شروع کنید">
    SGLang را با یک سرور سازگار با OpenAI اجرا کنید. URL پایهٔ شما باید نقاط پایانی
    `/v1` را در دسترس قرار دهد (برای مثال `/v1/models` و `/v1/chat/completions`). SGLang
    معمولاً روی این نشانی اجرا می‌شود:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="یک کلید API تنظیم کنید">
    اگر روی سرور شما احراز هویت پیکربندی نشده باشد، هر مقداری کار می‌کند:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="راه‌اندازی اولیه را اجرا کنید یا مستقیماً یک مدل تنظیم کنید">
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

## کشف مدل (ارائه‌دهندهٔ ضمنی)

وقتی `SGLANG_API_KEY` تنظیم شده باشد (یا یک پروفایل احراز هویت وجود داشته باشد) و شما
`models.providers.sglang` را تعریف **نکرده باشید**، OpenClaw این مورد را پرس‌وجو می‌کند:

- `GET http://127.0.0.1:30000/v1/models`

و شناسه‌های بازگردانده‌شده را به ورودی‌های مدل تبدیل می‌کند.

<Note>
اگر `models.providers.sglang` را صراحتاً تنظیم کنید، OpenClaw به‌صورت پیش‌فرض از مدل‌های
اعلام‌شدهٔ شما استفاده می‌کند. وقتی می‌خواهید OpenClaw نقطهٔ پایانی `/models` همان
ارائه‌دهندهٔ پیکربندی‌شده را پرس‌وجو کند و همهٔ مدل‌های اعلام‌شدهٔ SGLang را شامل شود،
`"sglang/*": {}` را به `agents.defaults.models` اضافه کنید.
</Note>

## پیکربندی صریح (مدل‌های دستی)

در این موارد از پیکربندی صریح استفاده کنید:

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
  <Accordion title="رفتار سبک پروکسی">
    SGLang به‌عنوان یک backend سازگار با OpenAI و سبک پروکسی برای `/v1` در نظر گرفته می‌شود، نه یک
    نقطهٔ پایانی بومی OpenAI.

    | رفتار | SGLang |
    |----------|--------|
    | شکل‌دهی درخواست فقط مخصوص OpenAI | اعمال نمی‌شود |
    | `service_tier`، Responses `store`، راهنمایی‌های prompt-cache | ارسال نمی‌شود |
    | شکل‌دهی payload سازگار با reasoning | اعمال نمی‌شود |
    | سرآیندهای انتساب پنهان (`originator`، `version`، `User-Agent`) | روی URLهای پایهٔ سفارشی SGLang تزریق نمی‌شود |

  </Accordion>

  <Accordion title="عیب‌یابی">
    **سرور در دسترس نیست**

    بررسی کنید سرور در حال اجراست و پاسخ می‌دهد:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **خطاهای احراز هویت**

    اگر درخواست‌ها با خطاهای احراز هویت ناموفق می‌شوند، یک `SGLANG_API_KEY` واقعی تنظیم کنید که با
    پیکربندی سرور شما مطابقت داشته باشد، یا ارائه‌دهنده را صراحتاً زیر
    `models.providers.sglang` پیکربندی کنید.

    <Tip>
    اگر SGLang را بدون احراز هویت اجرا می‌کنید، هر مقدار غیرخالی برای
    `SGLANG_API_KEY` برای اعلام آمادگی جهت کشف مدل کافی است.
    </Tip>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌وارهٔ کامل پیکربندی شامل ورودی‌های ارائه‌دهنده.
  </Card>
</CardGroup>
