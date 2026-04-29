---
read_when:
    - می‌خواهید یک کلید API واحد برای بسیاری از مدل‌های زبانی بزرگ داشته باشید
    - به راهنمای راه‌اندازی Baidu Qianfan نیاز دارید
summary: از API یکپارچهٔ Qianfan برای دسترسی به مدل‌های متعدد در OpenClaw استفاده کنید
title: چیان‌فان
x-i18n:
    generated_at: "2026-04-29T23:28:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan پلتفرم MaaS شرکت Baidu است که یک **API یکپارچه** فراهم می‌کند و درخواست‌ها را پشت یک
نقطه پایانی و کلید API واحد به مدل‌های بسیاری هدایت می‌کند. این پلتفرم با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر URL پایه کار می‌کنند.

| ویژگی | مقدار                             |
| -------- | --------------------------------- |
| ارائه‌دهنده | `qianfan`                         |
| احراز هویت     | `QIANFAN_API_KEY`                 |
| API      | سازگار با OpenAI                 |
| URL پایه | `https://qianfan.baidubce.com/v2` |

## شروع کار

<Steps>
  <Step title="Create a Baidu Cloud account">
    در [کنسول Qianfan](https://console.bce.baidu.com/qianfan/ais/console/apiKey) ثبت‌نام کنید یا وارد شوید و مطمئن شوید دسترسی Qianfan API برای شما فعال است.
  </Step>
  <Step title="Generate an API key">
    یک برنامه جدید بسازید یا یک برنامه موجود را انتخاب کنید، سپس یک کلید API تولید کنید. قالب کلید `bce-v3/ALTAK-...` است.
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

| ارجاع مدل                            | ورودی       | زمینه | بیشینه خروجی | استدلال | یادداشت‌ها         |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | متن        | 98,304  | 32,768     | بله       | مدل پیش‌فرض |
| `qianfan/ernie-5.0-thinking-preview` | متن، تصویر | 119,000 | 64,000     | بله       | چندوجهی    |

<Tip>
ارجاع مدل داخلی پیش‌فرض `qianfan/deepseek-v3.2` است. فقط زمانی باید `models.providers.qianfan` را بازنویسی کنید که به URL پایه سفارشی یا فراداده مدل نیاز داشته باشید.
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
    Qianfan از مسیر انتقال سازگار با OpenAI اجرا می‌شود، نه قالب‌دهی درخواست بومی OpenAI. یعنی قابلیت‌های استاندارد SDKهای OpenAI کار می‌کنند، اما ممکن است پارامترهای اختصاصی ارائه‌دهنده ارسال نشوند.
  </Accordion>

  <Accordion title="Catalog and overrides">
    کاتالوگ داخلی در حال حاضر شامل `deepseek-v3.2` و `ernie-5.0-thinking-preview` است. فقط زمانی `models.providers.qianfan` را اضافه یا بازنویسی کنید که به URL پایه سفارشی یا فراداده مدل نیاز داشته باشید.

    <Note>
    ارجاع‌های مدل از پیشوند `qianfan/` استفاده می‌کنند (برای مثال `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - مطمئن شوید کلید API شما با `bce-v3/ALTAK-` شروع می‌شود و دسترسی Qianfan API در کنسول Baidu Cloud برای آن فعال است.
    - اگر مدل‌ها فهرست نمی‌شوند، تأیید کنید سرویس Qianfan برای حساب شما فعال شده است.
    - URL پایه پیش‌فرض `https://qianfan.baidubce.com/v2` است. فقط زمانی آن را تغییر دهید که از نقطه پایانی یا پراکسی سفارشی استفاده می‌کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی OpenClaw.
  </Card>
  <Card title="Agent setup" href="/fa/concepts/agent" icon="robot">
    پیکربندی پیش‌فرض‌های agent و انتساب‌های مدل.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    مستندات رسمی Qianfan API.
  </Card>
</CardGroup>
