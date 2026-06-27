---
read_when:
    - می‌خواهید از Cerebras با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API Cerebras یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی Cerebras (احراز هویت + انتخاب مدل)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:38:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) استنتاج پرسرعت سازگار با OpenAI را روی سخت‌افزار استنتاج سفارشی ارائه می‌کند. Plugin ارائه‌دهنده Cerebras شامل یک کاتالوگ ایستای چهارمدلی است.

| ویژگی            | مقدار                                      |
| --------------- | ---------------------------------------- |
| شناسه ارائه‌دهنده | `cerebras`                               |
| Plugin          | بسته رسمی خارجی                           |
| متغیر محیطی احراز هویت | `CEREBRAS_API_KEY`                       |
| پرچم راه‌اندازی اولیه | `--auth-choice cerebras-api-key`         |
| پرچم مستقیم CLI | `--cerebras-api-key <key>`               |
| API             | سازگار با OpenAI (`openai-completions`) |
| نشانی پایه       | `https://api.cerebras.ai/v1`             |
| مدل پیش‌فرض      | `cerebras/zai-glm-4.7`                   |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="Get an API key">
    یک کلید API در [کنسول ابری Cerebras](https://cloud.cerebras.ai) ایجاد کنید.
  </Step>
  <Step title="Run onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```

    فهرست باید هر چهار مدل ایستا را شامل شود. اگر `CEREBRAS_API_KEY` حل نشود، `openclaw models status --json` اعتبارنامه گمشده را زیر `auth.unusableProfiles` گزارش می‌کند.

  </Step>
</Steps>

## راه‌اندازی غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## کاتالوگ داخلی

OpenClaw یک کاتالوگ ایستای Cerebras ارائه می‌کند که نقطه پایانی عمومی سازگار با OpenAI را بازتاب می‌دهد. هر چهار مدل زمینه ۱۲۸هزار و حداکثر ۸٬۱۹۲ توکن خروجی دارند.

| ارجاع مدل                                  | نام                  | استدلال | یادداشت‌ها                              |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | بله       | مدل پیش‌فرض؛ مدل استدلالی پیش‌نمایش     |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | بله       | مدل استدلالی تولیدی                    |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | خیر       | مدل غیر استدلالی پیش‌نمایش              |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | خیر       | مدل تولیدی متمرکز بر سرعت              |

<Warning>
  Cerebras مدل‌های `zai-glm-4.7` و `qwen-3-235b-a22b-instruct-2507` را به‌عنوان مدل‌های پیش‌نمایش علامت‌گذاری می‌کند، و مستند شده است که `llama3.1-8b` به‌همراه `qwen-3-235b-a22b-instruct-2507` در ۲۷ مه ۲۰۲۶ منسوخ می‌شوند. پیش از اتکا به آن‌ها برای بارهای کاری تولیدی، صفحه مدل‌های پشتیبانی‌شده Cerebras را بررسی کنید.
</Warning>

## پیکربندی دستی

این Plugin معمولا یعنی فقط به کلید API نیاز دارید. وقتی می‌خواهید فراداده مدل را بازنویسی کنید یا در برابر کاتالوگ ایستا با `mode: "merge"` اجرا کنید، از پیکربندی صریح `models.providers.cerebras` استفاده کنید:

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
  اگر Gateway به‌صورت یک دیمون اجرا می‌شود (launchd، systemd، Docker)، مطمئن شوید `CEREBRAS_API_KEY` برای آن فرایند در دسترس است — برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`. کلیدی که فقط در یک پوسته تعاملی صادر شده باشد، به یک سرویس مدیریت‌شده کمکی نمی‌کند مگر اینکه محیط به‌صورت جداگانه وارد شود.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model providers" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار تغییر مسیر در زمان خرابی.
  </Card>
  <Card title="Thinking modes" href="/fa/tools/thinking" icon="brain">
    سطوح تلاش استدلال برای دو مدل Cerebras دارای قابلیت استدلال.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل و پیکربندی مدل.
  </Card>
  <Card title="Models FAQ" href="/fa/help/faq-models" icon="circle-question">
    پروفایل‌های احراز هویت، تغییر مدل‌ها، و رفع خطاهای «no profile».
  </Card>
</CardGroup>
