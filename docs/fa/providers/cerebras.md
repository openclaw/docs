---
read_when:
    - می‌خواهید از Cerebras با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API سرویس Cerebras یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی Cerebras (احراز هویت + انتخاب مدل)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T10:36:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) استنتاج پرسرعتِ سازگار با OpenAI را روی سخت‌افزار سفارشی استنتاج ارائه می‌دهد. این Plugin با یک فهرست ثابت شامل چهار مدل عرضه می‌شود (بدون کشف زنده).

| ویژگی                  | مقدار                                                     |
| ---------------------- | --------------------------------------------------------- |
| شناسه ارائه‌دهنده      | `cerebras`                                                |
| Plugin                 | بسته رسمی خارجی (`@openclaw/cerebras-provider`)           |
| متغیر محیطی احراز هویت | `CEREBRAS_API_KEY`                                        |
| پرچم راه‌اندازی اولیه  | `--auth-choice cerebras-api-key`                          |
| پرچم مستقیم CLI        | `--cerebras-api-key <key>`                                |
| API                    | سازگار با OpenAI (`openai-completions`)                   |
| نشانی پایه             | `https://api.cerebras.ai/v1`                              |
| مدل پیش‌فرض            | `cerebras/zai-glm-4.7`                                    |

## نصب Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [کنسول ابری Cerebras](https://cloud.cerebras.ai) ایجاد کنید.
  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    <CodeGroup>

```bash راه‌اندازی اولیه
openclaw onboard --auth-choice cerebras-api-key
```

```bash پرچم مستقیم
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash فقط متغیر محیطی
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="بررسی در دسترس بودن مدل‌ها">
    ```bash
    openclaw models list --provider cerebras
    ```

    هر چهار مدل ثابت را فهرست می‌کند. اگر `CEREBRAS_API_KEY` قابل یافتن نباشد، `openclaw models status --json` اعتبارنامه مفقود را در `auth.unusableProfiles` گزارش می‌کند.

  </Step>
</Steps>

## راه‌اندازی غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## فهرست داخلی

هر چهار مدل دارای پنجره زمینه ۱۲۸ هزار توکنی و حداکثر ۸٬۱۹۲ توکن خروجی هستند.

| ارجاع مدل                                  | نام                  | استدلال | توضیحات                                    |
| ------------------------------------------ | -------------------- | ------- | ------------------------------------------ |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | بله     | مدل پیش‌فرض؛ مدل استدلالی پیش‌نمایش        |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | بله     | مدل استدلالی مناسب محیط عملیاتی            |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | خیر     | مدل غیر استدلالی پیش‌نمایش                 |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | خیر     | مدل عملیاتی متمرکز بر سرعت                 |

<Warning>
Cerebras مدل‌های `zai-glm-4.7` و `qwen-3-235b-a22b-instruct-2507` را پیش‌نمایش معرفی می‌کند و طبق مستندات، `llama3.1-8b` و `qwen-3-235b-a22b-instruct-2507` در ۲۷ مه ۲۰۲۶ منسوخ خواهند شد. پیش از اتکا به آن‌ها برای بارهای کاری عملیاتی، [صفحه مدل‌های پشتیبانی‌شده](https://inference-docs.cerebras.ai/models/overview) Cerebras را بررسی کنید.
</Warning>

## پیکربندی دستی

بیشتر راه‌اندازی‌ها فقط به کلید API نیاز دارند. برای بازنویسی فراداده مدل یا اجرا با `mode: "merge"` در کنار فهرست ثابت، از پیکربندی صریح `models.providers.cerebras` استفاده کنید:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
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
اگر Gateway به‌صورت دیمن (launchd، systemd یا Docker) اجرا می‌شود، مطمئن شوید `CEREBRAS_API_KEY` در دسترس آن فرایند است؛ برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`. کلیدی که فقط در یک پوسته تعاملی صادر شده باشد، به سرویس مدیریت‌شده کمکی نمی‌کند، مگر اینکه محیط به‌طور جداگانه وارد شود.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار انتقال در هنگام خرابی.
  </Card>
  <Card title="حالت‌های تفکر" href="/fa/tools/thinking" icon="brain">
    سطوح تلاش استدلالی برای دو مدل Cerebras دارای قابلیت استدلال.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل و پیکربندی مدل.
  </Card>
  <Card title="پرسش‌های متداول مدل‌ها" href="/fa/help/faq-models" icon="circle-question">
    نمایه‌های احراز هویت، تغییر مدل‌ها و رفع خطاهای «no profile».
  </Card>
</CardGroup>
