---
read_when:
    - شما یک کلید API واحد برای چندین LLM می‌خواهید
    - شما به راهنمای راه‌اندازی Baidu Qianfan نیاز دارید
summary: از API یکپارچهٔ Qianfan برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan پلتفرم MaaS شرکت Baidu است که یک **API یکپارچه** ارائه می‌دهد و درخواست‌ها را پشت یک endpoint و کلید API واحد به مدل‌های متعدد هدایت می‌کند. این پلتفرم با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر base URL کار می‌کنند.

| ویژگی | مقدار                             |
| -------- | --------------------------------- |
| ارائه‌دهنده | `qianfan`                         |
| احراز هویت     | `QIANFAN_API_KEY`                 |
| API      | سازگار با OpenAI                 |
| Base URL | `https://qianfan.baidubce.com/v2` |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="Create a Baidu Cloud account">
    در [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) ثبت‌نام کنید یا وارد شوید و مطمئن شوید دسترسی API Qianfan برای شما فعال است.
  </Step>
  <Step title="Generate an API key">
    یک برنامه جدید ایجاد کنید یا یکی از برنامه‌های موجود را انتخاب کنید، سپس یک کلید API بسازید. قالب کلید `bce-v3/ALTAK-...` است.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## کاتالوگ داخلی

| Model ref                            | ورودی       | زمینه | حداکثر خروجی | استدلال | یادداشت‌ها         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | متن        | 98,304  | 32,768     | بله       | مدل پیش‌فرض |
| `qianfan/ernie-5.0-thinking-preview` | متن، تصویر | 119,000 | 64,000     | بله       | چندوجهی    |

<Tip>
Model ref پیش‌فرض `qianfan/deepseek-v3.2` است. فقط زمانی باید `models.providers.qianfan` را بازنویسی کنید که به base URL سفارشی یا فراداده مدل نیاز داشته باشید.
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

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Qianfan از مسیر انتقال سازگار با OpenAI اجرا می‌شود، نه از شکل‌دهی درخواست بومی OpenAI. این یعنی قابلیت‌های استاندارد SDKهای OpenAI کار می‌کنند، اما ممکن است پارامترهای اختصاصی ارائه‌دهنده ارسال نشوند.
  </Accordion>

  <Accordion title="Catalog and overrides">
    کاتالوگ ایستا در حال حاضر شامل `deepseek-v3.2` و `ernie-5.0-thinking-preview` است. فقط زمانی `models.providers.qianfan` را اضافه یا بازنویسی کنید که به base URL سفارشی یا فراداده مدل نیاز داشته باشید.

    <Note>
    Model refها از پیشوند `qianfan/` استفاده می‌کنند (برای مثال `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - مطمئن شوید کلید API شما با `bce-v3/ALTAK-` شروع می‌شود و دسترسی API Qianfan در کنسول Baidu Cloud فعال است.
    - اگر مدل‌ها فهرست نمی‌شوند، تأیید کنید که سرویس Qianfan برای حساب شما فعال شده است.
    - Base URL پیش‌فرض `https://qianfan.baidubce.com/v2` است. فقط در صورتی آن را تغییر دهید که از endpoint یا proxy سفارشی استفاده می‌کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، model refها و رفتار failover.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="Agent setup" href="/fa/concepts/agent" icon="robot">
    پیکربندی پیش‌فرض‌های agent و تخصیص مدل‌ها.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    مستندات رسمی API Qianfan.
  </Card>
</CardGroup>
