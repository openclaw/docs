---
read_when:
    - شما یک کلید API واحد برای چندین مدل زبانی بزرگ می‌خواهید
    - شما به راهنمای راه‌اندازی Baidu Qianfan نیاز دارید
summary: از API یکپارچهٔ Qianfan برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: چیان‌فان
x-i18n:
    generated_at: "2026-07-12T10:43:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan پلتفرم MaaS شرکت Baidu است: یک API یکپارچه و سازگار با OpenAI که درخواست‌ها را از طریق یک نقطه پایانی و کلید API واحد به مدل‌های متعدد هدایت می‌کند. OpenClaw آن را به‌عنوان Plugin خارجی رسمی `@openclaw/qianfan-provider` ارائه می‌کند.

| ویژگی         | مقدار                                    |
| ------------- | ---------------------------------------- |
| ارائه‌دهنده   | `qianfan`                                |
| احراز هویت    | `QIANFAN_API_KEY`                        |
| API           | سازگار با OpenAI (`openai-completions`) |
| نشانی پایه    | `https://qianfan.baidubce.com/v2`        |
| مدل پیش‌فرض   | `qianfan/deepseek-v3.2`                  |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## شروع کار

<Steps>
  <Step title="ایجاد حساب Baidu Cloud">
    در [کنسول Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) ثبت‌نام یا وارد شوید و مطمئن شوید دسترسی شما به API سرویس Qianfan فعال است.
  </Step>
  <Step title="ایجاد کلید API">
    یک برنامه جدید ایجاد یا برنامه‌ای موجود را انتخاب کنید، سپس یک کلید API بسازید. کلیدهای Baidu Cloud از قالب `bce-v3/ALTAK-...` استفاده می‌کنند.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    اجراهای غیرتعاملی کلید را از `--qianfan-api-key <key>` یا
    `QIANFAN_API_KEY` می‌خوانند. راه‌اندازی اولیه پیکربندی ارائه‌دهنده را می‌نویسد، نام مستعار
    `QIANFAN` را برای مدل پیش‌فرض اضافه می‌کند و در صورت پیکربندی‌نشدن هیچ مدلی،
    `qianfan/deepseek-v3.2` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.

  </Step>
  <Step title="بررسی دردسترس‌بودن مدل">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## فهرست داخلی

| مرجع مدل                            | ورودی       | زمینه   | حداکثر خروجی | استدلال | توضیحات       |
| ------------------------------------ | ----------- | ------- | ------------ | ------- | ------------- |
| `qianfan/deepseek-v3.2`              | متن         | 98,304  | 32,768       | بله     | مدل پیش‌فرض   |
| `qianfan/ernie-5.0-thinking-preview` | متن، تصویر  | 119,000 | 64,000       | بله     | چندوجهی       |

این فهرست ثابت است؛ شناسایی زنده مدل وجود ندارد.

<Tip>
تنها زمانی لازم است `models.providers.qianfan` را بازنویسی کنید که به نشانی پایه سفارشی یا فراداده سفارشی مدل نیاز داشته باشید.
</Tip>

## نمونه پیکربندی

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<Note>
مراجع مدل از پیشوند `qianfan/` استفاده می‌کنند (برای مثال `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="انتقال و سازگاری">
    Qianfan از مسیر انتقال سازگار با OpenAI استفاده می‌کند، نه قالب‌بندی بومی درخواست‌های OpenAI. قابلیت‌های استاندارد SDK مربوط به OpenAI کار می‌کنند، اما ممکن است پارامترهای مختص ارائه‌دهنده ارسال نشوند.
  </Accordion>

  <Accordion title="عیب‌یابی">
    - مطمئن شوید کلید API شما با `bce-v3/ALTAK-` آغاز می‌شود و دسترسی آن به API سرویس Qianfan در کنسول Baidu Cloud فعال است.
    - اگر مدل‌ها فهرست نمی‌شوند، تأیید کنید سرویس Qianfan برای حساب شما فعال شده است.
    - نشانی پایه را فقط در صورت استفاده از نقطه پایانی یا پراکسی سفارشی تغییر دهید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل و رفتار جایگزینی در صورت خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="راه‌اندازی عامل" href="/fa/concepts/agent" icon="robot">
    پیکربندی پیش‌فرض‌های عامل و تخصیص مدل‌ها.
  </Card>
  <Card title="مستندات API سرویس Qianfan" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    مستندات رسمی API سرویس Qianfan.
  </Card>
</CardGroup>
