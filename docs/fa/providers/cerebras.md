---
read_when:
    - می‌خواهید از Cerebras با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API Cerebras یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Cerebras (احراز هویت + انتخاب مدل)
title: Cerebras
x-i18n:
    generated_at: "2026-04-29T23:23:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) استنتاج سازگار با OpenAI با سرعت بالا ارائه می‌دهد.

| ویژگی | مقدار                        |
| -------- | ---------------------------- |
| ارائه‌دهنده | `cerebras`                   |
| احراز هویت     | `CEREBRAS_API_KEY`           |
| API      | سازگار با OpenAI            |
| URL پایه | `https://api.cerebras.ai/v1` |

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [کنسول ابری Cerebras](https://cloud.cerebras.ai) ایجاد کنید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="تأیید در دسترس بودن مدل‌ها">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### راه‌اندازی غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## کاتالوگ داخلی

OpenClaw یک کاتالوگ ایستای Cerebras را برای نقطه پایانی عمومی سازگار با OpenAI ارائه می‌کند:

| ارجاع مدل                                 | نام                 | یادداشت‌ها                                  |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | مدل پیش‌فرض؛ مدل استدلالی پیش‌نمایش |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | مدل استدلالی تولید             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | مدل غیر‌استدلالی پیش‌نمایش            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | مدل تولید متمرکز بر سرعت         |

<Warning>
Cerebras مدل‌های `zai-glm-4.7` و `qwen-3-235b-a22b-instruct-2507` را به‌عنوان مدل‌های پیش‌نمایش علامت‌گذاری می‌کند، و مستند شده است که `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` در تاریخ ۲۷ مه ۲۰۲۶ منسوخ خواهند شد. پیش از اتکا به آن‌ها برای تولید، صفحه مدل‌های پشتیبانی‌شده Cerebras را بررسی کنید.
</Warning>

## پیکربندی دستی

Plugin همراه معمولاً یعنی فقط به کلید API نیاز دارید. زمانی از پیکربندی صریح
`models.providers.cerebras` استفاده کنید که می‌خواهید فراداده مدل را بازنویسی کنید:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
اگر Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید `CEREBRAS_API_KEY`
برای آن فرایند در دسترس است، برای مثال در `~/.openclaw/.env` یا از طریق
`env.shellEnv`.
</Note>
