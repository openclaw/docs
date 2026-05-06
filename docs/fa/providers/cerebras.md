---
read_when:
    - می‌خواهید از Cerebras با OpenClaw استفاده کنید
    - به متغیر محیطی کلید APIِ Cerebras یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Cerebras (احراز هویت + انتخاب مدل)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T09:37:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) استنتاج پرسرعت سازگار با OpenAI را روی سخت‌افزار استنتاج سفارشی ارائه می‌دهد. OpenClaw یک Plugin ارائه‌دهندهٔ Cerebras همراه دارد که شامل یک کاتالوگ ثابت چهارمدلی است.

| ویژگی           | مقدار                                   |
| --------------- | ---------------------------------------- |
| شناسهٔ ارائه‌دهنده | `cerebras`                               |
| Plugin          | همراه، `enabledByDefault: true`        |
| متغیر محیطی احراز هویت | `CEREBRAS_API_KEY`                       |
| پرچم راه‌اندازی اولیه | `--auth-choice cerebras-api-key`         |
| پرچم مستقیم CLI | `--cerebras-api-key <key>`               |
| API             | سازگار با OpenAI (`openai-completions`) |
| URL پایه        | `https://api.cerebras.ai/v1`             |
| مدل پیش‌فرض     | `cerebras/zai-glm-4.7`                   |

## شروع به کار

<Steps>
  <Step title="دریافت کلید API">
    یک کلید API در [Cerebras Cloud Console](https://cloud.cerebras.ai) ایجاد کنید.
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

```bash فقط محیط
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="تأیید در دسترس بودن مدل‌ها">
    ```bash
    openclaw models list --provider cerebras
    ```

    این فهرست باید هر چهار مدل همراه را شامل شود. اگر `CEREBRAS_API_KEY` قابل حل نباشد، `openclaw models status --json` اعتبارنامهٔ گمشده را زیر `auth.unusableProfiles` گزارش می‌کند.

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

OpenClaw یک کاتالوگ ثابت Cerebras ارائه می‌کند که با نقطهٔ پایانی عمومی سازگار با OpenAI همخوان است. هر چهار مدل، زمینهٔ 128k و حداکثر 8,192 توکن خروجی دارند.

| ارجاع مدل                                 | نام                  | استدلال | یادداشت‌ها                             |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | بله      | مدل پیش‌فرض؛ مدل استدلال پیش‌نمایش |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | بله      | مدل استدلال تولیدی             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | خیر        | مدل غیر استدلالی پیش‌نمایش            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | خیر        | مدل تولیدی متمرکز بر سرعت         |

<Warning>
  Cerebras مدل‌های `zai-glm-4.7` و `qwen-3-235b-a22b-instruct-2507` را به‌عنوان مدل‌های پیش‌نمایش علامت‌گذاری می‌کند، و `llama3.1-8b` به‌همراه `qwen-3-235b-a22b-instruct-2507` برای منسوخ شدن در 27 مه 2026 مستند شده‌اند. پیش از اتکا به آن‌ها برای بارهای کاری تولیدی، صفحهٔ مدل‌های پشتیبانی‌شدهٔ Cerebras را بررسی کنید.
</Warning>

## پیکربندی دستی

Plugin همراه معمولاً یعنی فقط به کلید API نیاز دارید. وقتی می‌خواهید فرادادهٔ مدل را بازنویسی کنید یا در برابر کاتالوگ ثابت با `mode: "merge"` اجرا کنید، از پیکربندی صریح `models.providers.cerebras` استفاده کنید:

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
  اگر Gateway به‌صورت daemon اجرا می‌شود (launchd، systemd، Docker)، مطمئن شوید `CEREBRAS_API_KEY` برای آن فرایند در دسترس است؛ برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`. کلیدی که فقط در `~/.profile` قرار دارد، به یک سرویس مدیریت‌شده کمکی نمی‌کند مگر اینکه env جداگانه وارد شود.
</Note>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="حالت‌های تفکر" href="/fa/tools/thinking" icon="brain">
    سطوح تلاش استدلال برای دو مدل Cerebras دارای قابلیت استدلال.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل و پیکربندی مدل.
  </Card>
  <Card title="پرسش‌های متداول مدل‌ها" href="/fa/help/faq-models" icon="circle-question">
    پروفایل‌های احراز هویت، تغییر مدل‌ها، و رفع خطاهای «no profile».
  </Card>
</CardGroup>
