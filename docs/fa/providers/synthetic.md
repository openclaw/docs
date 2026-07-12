---
read_when:
    - می‌خواهید از Synthetic به‌عنوان ارائه‌دهندهٔ مدل استفاده کنید
    - به یک کلید API یا پیکربندی URL پایه برای Synthetic نیاز دارید
summary: استفاده از API سازگار با Anthropic متعلق به Synthetic در OpenClaw
title: مصنوعی
x-i18n:
    generated_at: "2026-07-12T10:47:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1882a34aa1ca52403b92effdbf3b753fd911575af6d8b8aa5d692245b8e8f1b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) نقاط پایانی سازگار با Anthropic ارائه می‌کند.
OpenClaw آن را به‌عنوان ارائه‌دهندهٔ `synthetic` عرضه می‌کند و از API پیام‌های Anthropic
استفاده می‌کند.

| ویژگی        | مقدار                                  |
| ------------ | -------------------------------------- |
| ارائه‌دهنده  | `synthetic`                            |
| احراز هویت   | `SYNTHETIC_API_KEY`                    |
| API          | پیام‌های Anthropic                     |
| نشانی پایه   | `https://api.synthetic.new/anthropic`  |

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک `SYNTHETIC_API_KEY` از حساب Synthetic خود دریافت کنید، یا اجازه دهید فرایند راه‌اندازی
    آن را از شما درخواست کند.
  </Step>
  <Step title="اجرای راه‌اندازی">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="بررسی مدل پیش‌فرض">
    فرایند راه‌اندازی، مدل پیش‌فرض را روی مقدار زیر تنظیم می‌کند:
    ```text
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
کلاینت Anthropic در OpenClaw به‌طور خودکار `/v1` را به نشانی پایه اضافه می‌کند؛ بنابراین از
`https://api.synthetic.new/anthropic` استفاده کنید (نه `/anthropic/v1`). اگر Synthetic
نشانی پایهٔ خود را تغییر داد، `models.providers.synthetic.baseUrl` را بازنویسی کنید.
</Warning>

## نمونهٔ پیکربندی

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## فهرست داخلی

هزینهٔ همهٔ مدل‌های Synthetic برابر با `0` است (ورودی/خروجی/حافظهٔ نهان).

| شناسهٔ مدل                                             | پنجرهٔ زمینه | حداکثر توکن | استدلال | ورودی       |
| ------------------------------------------------------ | ------------ | ----------- | ------- | ----------- |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000      | 65,536      | خیر     | متن         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000      | 8,192       | بله     | متن         |
| `hf:zai-org/GLM-4.7`                                   | 198,000      | 128,000     | خیر     | متن         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000      | 8,192       | خیر     | متن         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000      | 8,192       | خیر     | متن         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000      | 8,192       | خیر     | متن         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000      | 8,192       | خیر     | متن         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000      | 8,192       | خیر     | متن         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000      | 8,192       | خیر     | متن         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000      | 8,192       | خیر     | متن         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000      | 8,192       | خیر     | متن         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000      | 8,192       | بله     | متن + تصویر |
| `hf:openai/gpt-oss-120b`                               | 128,000      | 8,192       | خیر     | متن         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000      | 8,192       | خیر     | متن         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000      | 8,192       | خیر     | متن         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000      | 8,192       | خیر     | متن + تصویر |
| `hf:zai-org/GLM-4.5`                                   | 128,000      | 128,000     | خیر     | متن         |
| `hf:zai-org/GLM-4.6`                                   | 198,000      | 128,000     | خیر     | متن         |
| `hf:zai-org/GLM-5`                                     | 256,000      | 128,000     | بله     | متن + تصویر |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000      | 8,192       | خیر     | متن         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000      | 8,192       | بله     | متن         |

<Tip>
ارجاع‌های مدل از قالب `synthetic/<modelId>` استفاده می‌کنند. برای مشاهدهٔ همهٔ مدل‌های موجود در
حساب خود، از `openclaw models list --provider synthetic` استفاده کنید.
</Tip>

<AccordionGroup>
  <Accordion title="فهرست مجاز مدل‌ها">
    اگر فهرست مجاز مدل‌ها (`agents.defaults.models`) را فعال می‌کنید، همهٔ
    مدل‌های Synthetic را که قصد استفاده از آن‌ها دارید، اضافه کنید. مدل‌هایی که در فهرست مجاز نیستند
    از عامل پنهان می‌شوند.
  </Accordion>

  <Accordion title="بازنویسی نشانی پایه">
    اگر Synthetic نقطهٔ پایانی API خود را تغییر داد، نشانی پایه را بازنویسی کنید:

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    OpenClaw همچنان `/v1` را به‌طور خودکار اضافه می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    قواعد ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌وارهٔ کامل پیکربندی، شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    پیشخوان Synthetic و مستندات API.
  </Card>
</CardGroup>
