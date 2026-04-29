---
read_when:
    - می‌خواهید از Synthetic به‌عنوان ارائه‌دهندهٔ مدل استفاده کنید
    - به یک کلید API برای Synthetic یا پیکربندی URL پایه نیاز دارید
summary: از رابط برنامه‌نویسی کاربردی سازگار با Anthropic متعلق به Synthetic در OpenClaw استفاده کنید
title: مصنوعی
x-i18n:
    generated_at: "2026-04-29T23:29:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 81a48573782d46f0b018d19ab607729b236c241e57535e4af52eb8c142fee59b
    source_path: providers/synthetic.md
    workflow: 16
---

[Synthetic](https://synthetic.new) نقاط پایانی سازگار با Anthropic را ارائه می‌کند.
OpenClaw آن را به‌عنوان ارائه‌دهنده `synthetic` ثبت می‌کند و از API پیام‌های Anthropic
استفاده می‌کند.

| ویژگی | مقدار                                 |
| -------- | ------------------------------------- |
| ارائه‌دهنده | `synthetic`                           |
| احراز هویت     | `SYNTHETIC_API_KEY`                   |
| API      | پیام‌های Anthropic                    |
| نشانی پایه | `https://api.synthetic.new/anthropic` |

## شروع کار

<Steps>
  <Step title="دریافت کلید API">
    یک `SYNTHETIC_API_KEY` از حساب Synthetic خود دریافت کنید، یا اجازه دهید
    راهنمای شروع به کار از شما آن را بخواهد.
  </Step>
  <Step title="اجرای شروع به کار">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="تأیید مدل پیش‌فرض">
    پس از شروع به کار، مدل پیش‌فرض روی این مقدار تنظیم می‌شود:
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
کلاینت Anthropic در OpenClaw به‌طور خودکار `/v1` را به نشانی پایه اضافه می‌کند، بنابراین از
`https://api.synthetic.new/anthropic` استفاده کنید (نه `/anthropic/v1`). اگر Synthetic
نشانی پایه خود را تغییر داد، `models.providers.synthetic.baseUrl` را بازنویسی کنید.
</Warning>

## نمونه پیکربندی

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

## کاتالوگ داخلی

همه مدل‌های Synthetic از هزینه `0` استفاده می‌کنند (ورودی/خروجی/کش).

| شناسه مدل                                               | پنجره زمینه | حداکثر توکن‌ها | استدلال | ورودی        |
| ------------------------------------------------------ | -------------- | ---------- | --------- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000        | 65,536     | خیر        | متن         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000        | 8,192      | بله       | متن         |
| `hf:zai-org/GLM-4.7`                                   | 198,000        | 128,000    | خیر        | متن         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000        | 8,192      | خیر        | متن         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000        | 8,192      | خیر        | متن         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000        | 8,192      | خیر        | متن         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000        | 8,192      | خیر        | متن         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000        | 8,192      | خیر        | متن         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000        | 8,192      | خیر        | متن         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000        | 8,192      | خیر        | متن         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000        | 8,192      | خیر        | متن         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000        | 8,192      | بله       | متن + تصویر |
| `hf:openai/gpt-oss-120b`                               | 128,000        | 8,192      | خیر        | متن         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000        | 8,192      | خیر        | متن         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000        | 8,192      | خیر        | متن         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000        | 8,192      | خیر        | متن + تصویر |
| `hf:zai-org/GLM-4.5`                                   | 128,000        | 128,000    | خیر        | متن         |
| `hf:zai-org/GLM-4.6`                                   | 198,000        | 128,000    | خیر        | متن         |
| `hf:zai-org/GLM-5`                                     | 256,000        | 128,000    | بله       | متن + تصویر |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000        | 8,192      | خیر        | متن         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000        | 8,192      | بله       | متن         |

<Tip>
ارجاع‌های مدل از قالب `synthetic/<modelId>` استفاده می‌کنند. برای دیدن همه مدل‌های موجود در
حساب خود، از `openclaw models list --provider synthetic` استفاده کنید.
</Tip>

<AccordionGroup>
  <Accordion title="فهرست مجاز مدل‌ها">
    اگر فهرست مجاز مدل‌ها (`agents.defaults.models`) را فعال کنید، هر مدل
    Synthetic را که قصد استفاده از آن را دارید اضافه کنید. مدل‌هایی که در فهرست مجاز نیستند
    از agent پنهان خواهند شد.
  </Accordion>

  <Accordion title="بازنویسی نشانی پایه">
    اگر Synthetic نقطه پایانی API خود را تغییر داد، نشانی پایه را در پیکربندی خود بازنویسی کنید:

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

    به یاد داشته باشید که OpenClaw به‌طور خودکار `/v1` را اضافه می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    قواعد ارائه‌دهنده، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    داشبورد Synthetic و مستندات API.
  </Card>
</CardGroup>
