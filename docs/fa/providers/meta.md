---
read_when:
    - می‌خواهید از Meta با OpenClaw استفاده کنید
    - به متغیر محیطی `MODEL_API_KEY` یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی Meta (احراز هویت + انتخاب مدل muse-spark-1.1)
title: فراداده
x-i18n:
    generated_at: "2026-07-12T10:41:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f2ce7616d9abc14a2d15ee53ea7725d3e70059af1a38bb61dbfe5b3969106432
    source_path: providers/meta.md
    workflow: 16
---

**Meta API** برای مدل استدلالی `muse-spark-1.1` از **Responses API** سازگار با OpenAI (`POST /v1/responses`) استفاده می‌کند. ارائه‌دهنده به‌صورت یک Plugin همراه OpenClaw عرضه می‌شود.

| ویژگی                  | مقدار                              |
| ---------------------- | ---------------------------------- |
| شناسه ارائه‌دهنده      | `meta`                             |
| Plugin                 | ارائه‌دهنده همراه                  |
| متغیر محیطی احراز هویت | `MODEL_API_KEY`                    |
| پرچم راه‌اندازی اولیه  | `--auth-choice meta-api-key`       |
| پرچم مستقیم CLI        | `--meta-api-key <key>`             |
| API                    | Responses API (`openai-responses`) |
| نشانی پایه             | `https://api.meta.ai/v1`           |
| مدل پیش‌فرض            | `meta/muse-spark-1.1`              |
| استدلال پیش‌فرض        | `high` (`reasoning.effort`)        |

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice meta-api-key
```

```bash Direct flag
openclaw onboard --non-interactive --accept-risk \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

```bash Env only
export MODEL_API_KEY=<key>
```

    </CodeGroup>

  </Step>
  <Step title="بررسی دردسترس‌بودن مدل‌ها">
    ```bash
    openclaw models list --provider meta
    ```

    مدخل ایستای `muse-spark-1.1` را در فهرست مدل‌ها نمایش می‌دهد. اگر `MODEL_API_KEY` قابل تشخیص نباشد،
    `openclaw models status --json` اعتبارنامه مفقود را در
    `auth.unusableProfiles` گزارش می‌کند.

  </Step>
</Steps>

## راه‌اندازی غیرتعاملی

```bash
openclaw onboard --non-interactive --accept-risk \
  --mode local \
  --auth-choice meta-api-key \
  --meta-api-key "$MODEL_API_KEY"
```

## فهرست داخلی

| مرجع مدل               | نام            | استدلال | پنجره زمینه | حداکثر خروجی |
| ---------------------- | -------------- | ------- | ------------ | ------------ |
| `meta/muse-spark-1.1`  | Muse Spark 1.1 | بله     | 1,048,576    | 131,072      |

قابلیت‌ها:

- ورودی متن و تصویر
- فراخوانی ابزار و پخش جریانی
- میزان تلاش استدلالی: `minimal`، `low`، `medium`، `high`، `xhigh` (پیش‌فرض: `high`)
- بازپخش استدلال رمزگذاری‌شده بدون حالت (`store: false`، `include: ["reasoning.encrypted_content"]`)

<Warning>
`muse-spark-1.1` مقدار `reasoning.effort: "none"` را نمی‌پذیرد. OpenClaw برای این ارائه‌دهنده
`--thinking off` را به `minimal` نگاشت می‌کند.
</Warning>

## پیکربندی دستی

```json5
{
  env: { MODEL_API_KEY: "<key>" },
  agents: {
    defaults: {
      model: { primary: "meta/muse-spark-1.1" },
      models: {
        "meta/muse-spark-1.1": { alias: "Muse Spark 1.1" },
      },
    },
  },
}
```

<Note>
اگر Gateway به‌صورت سرویس پس‌زمینه (launchd، systemd یا Docker) اجرا می‌شود، مطمئن شوید
`MODEL_API_KEY` برای آن فرایند در دسترس است؛ برای نمونه در
`~/.openclaw/.env` یا از طریق `env.shellEnv`. کلیدی که فقط در یک
پوسته تعاملی صادر شده باشد، به سرویس مدیریت‌شده کمکی نمی‌کند، مگر اینکه محیط
به‌طور جداگانه وارد شود.
</Note>

## آزمون دود

```bash
export MODEL_API_KEY=<key>
pnpm test:live -- extensions/meta/meta.live.test.ts
```

آزمون‌های زنده، `muse-spark-1.1` را در برابر `POST /v1/responses` اجرا می‌کنند.

## مطالب مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="حالت‌های تفکر" href="/fa/tools/thinking" icon="brain">
    سطوح تلاش استدلالی برای muse-spark-1.1.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    تنظیمات پیش‌فرض عامل و پیکربندی مدل.
  </Card>
</CardGroup>
