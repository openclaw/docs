---
read_when:
    - می‌خواهید OpenClaw را با یک سرور محلی SGLang اجرا کنید
    - شما نقاط پایانی سازگار با OpenAI در /v1 را برای مدل‌های خودتان می‌خواهید
summary: اجرای OpenClaw با SGLang (سرور خودمیزبان سازگار با OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-05-06T09:39:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e65e38868e061e03d15348725971880ca503dc61a7425c1fbdc718fd684728f
    source_path: providers/sglang.md
    workflow: 16
---

SGLang مدل‌های open-weight را از طریق یک HTTP API سازگار با OpenAI ارائه می‌کند. OpenClaw با استفاده از خانواده ارائه‌دهنده `openai-completions` و با کشف خودکار مدل‌های در دسترس به SGLang متصل می‌شود.

| ویژگی                    | مقدار                                                        |
| ------------------------- | ------------------------------------------------------------ |
| شناسه ارائه‌دهنده         | `sglang`                                                     |
| Plugin                    | باندل‌شده، `enabledByDefault: true`                          |
| متغیر محیطی احراز هویت    | `SGLANG_API_KEY` (اگر سرور احراز هویت ندارد، هر مقدار غیرخالی) |
| پرچم راه‌اندازی اولیه     | `--auth-choice sglang`                                       |
| API                       | سازگار با OpenAI (`openai-completions`)                      |
| URL پایه پیش‌فرض          | `http://127.0.0.1:30000/v1`                                  |
| جای‌نگهدار مدل پیش‌فرض    | `sglang/Qwen/Qwen3-8B`                                       |
| کاربرد پخش جریانی         | بله (`supportsStreamingUsage: true`)                         |
| قیمت‌گذاری                | به‌عنوان external-free علامت‌گذاری شده (`modelPricing.external: false`) |

OpenClaw همچنین وقتی با `SGLANG_API_KEY` فعال‌سازی می‌کنید و ورودی صریح `models.providers.sglang` تعریف نکرده‌اید، مدل‌های در دسترس را از SGLang **به‌طور خودکار کشف می‌کند** — پایین‌تر [کشف مدل (ارائه‌دهنده ضمنی)](#model-discovery-implicit-provider) را ببینید.

## شروع به کار

<Steps>
  <Step title="SGLang را شروع کنید">
    SGLang را با یک سرور سازگار با OpenAI اجرا کنید. URL پایه شما باید endpointهای
    `/v1` را در دسترس بگذارد (برای مثال `/v1/models`، `/v1/chat/completions`). SGLang
    معمولا روی این نشانی اجرا می‌شود:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="یک کلید API تنظیم کنید">
    اگر روی سرور شما احراز هویت پیکربندی نشده باشد، هر مقداری کار می‌کند:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="راه‌اندازی اولیه را اجرا کنید یا مستقیما یک مدل تنظیم کنید">
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

وقتی `SGLANG_API_KEY` تنظیم شده باشد (یا یک پروفایل احراز هویت وجود داشته باشد) و شما
`models.providers.sglang` را **تعریف نکرده باشید**، OpenClaw این درخواست را می‌فرستد:

- `GET http://127.0.0.1:30000/v1/models`

و شناسه‌های برگشتی را به ورودی‌های مدل تبدیل می‌کند.

<Note>
اگر `models.providers.sglang` را صراحتا تنظیم کنید، کشف خودکار نادیده گرفته می‌شود و
باید مدل‌ها را به‌صورت دستی تعریف کنید.
</Note>

## پیکربندی صریح (مدل‌های دستی)

وقتی از پیکربندی صریح استفاده کنید که:

- SGLang روی میزبان/درگاه متفاوتی اجرا می‌شود.
- می‌خواهید مقادیر `contextWindow`/`maxTokens` را ثابت کنید.
- سرور شما به یک کلید API واقعی نیاز دارد (یا می‌خواهید headerها را کنترل کنید).

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
  <Accordion title="رفتار به سبک پروکسی">
    SGLang به‌عنوان یک backend سازگار با OpenAI و به سبک پروکسی برای `/v1` در نظر گرفته می‌شود، نه یک
    endpoint بومی OpenAI.

    | رفتار | SGLang |
    |----------|--------|
    | شکل‌دهی درخواست مخصوص OpenAI | اعمال نمی‌شود |
    | `service_tier`، `store` در Responses، راهنمایی‌های prompt-cache | ارسال نمی‌شود |
    | شکل‌دهی payload سازگار با reasoning | اعمال نمی‌شود |
    | headerهای attribution پنهان (`originator`، `version`، `User-Agent`) | روی URLهای پایه سفارشی SGLang تزریق نمی‌شود |

  </Accordion>

  <Accordion title="عیب‌یابی">
    **سرور در دسترس نیست**

    بررسی کنید سرور در حال اجرا است و پاسخ می‌دهد:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **خطاهای احراز هویت**

    اگر درخواست‌ها با خطاهای احراز هویت شکست می‌خورند، یک `SGLANG_API_KEY` واقعی تنظیم کنید که با
    پیکربندی سرور شما مطابقت داشته باشد، یا ارائه‌دهنده را به‌صورت صریح زیر
    `models.providers.sglang` پیکربندی کنید.

    <Tip>
    اگر SGLang را بدون احراز هویت اجرا می‌کنید، هر مقدار غیرخالی برای
    `SGLANG_API_KEY` برای فعال‌سازی کشف مدل کافی است.
    </Tip>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    schema کامل پیکربندی شامل ورودی‌های ارائه‌دهنده.
  </Card>
</CardGroup>
