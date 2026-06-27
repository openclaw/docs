---
read_when:
    - می‌خواهید از Fireworks با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API Fireworks یا شناسه مدل پیش‌فرض نیاز دارید
    - در حال اشکال‌زدایی رفتار Kimi با تفکر خاموش روی Fireworks
summary: راه‌اندازی Fireworks (احراز هویت + انتخاب مدل)
title: آتش‌بازی
x-i18n:
    generated_at: "2026-06-27T18:39:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) مدل‌های open-weight و مدل‌های مسیریابی‌شده را از طریق یک API سازگار با OpenAI ارائه می‌کند. Plugin رسمی ارائه‌دهنده Fireworks را نصب کنید تا از دو مدل Kimi از پیش فهرست‌شده و هر مدل یا شناسه روتر Fireworks در زمان اجرا استفاده کنید.

| ویژگی        | مقدار                                                  |
| --------------- | ------------------------------------------------------ |
| شناسه ارائه‌دهنده     | `fireworks` (نام مستعار: `fireworks-ai`)                    |
| بسته         | `@openclaw/fireworks-provider`                         |
| متغیر محیطی احراز هویت    | `FIREWORKS_API_KEY`                                    |
| پرچم راه‌اندازی اولیه | `--auth-choice fireworks-api-key`                      |
| پرچم مستقیم CLI | `--fireworks-api-key <key>`                            |
| API             | سازگار با OpenAI (`openai-completions`)               |
| URL پایه        | `https://api.fireworks.ai/inference/v1`                |
| مدل پیش‌فرض   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| نام مستعار پیش‌فرض   | `Kimi K2.5 Turbo`                                      |

## شروع به کار

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Set the Fireworks API key">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    راه‌اندازی اولیه، کلید را برای ارائه‌دهنده `fireworks` در پروفایل‌های احراز هویت شما ذخیره می‌کند و روتر Kimi K2.5 Turbo با **Fire Pass** را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    فهرست باید شامل `Kimi K2.6` و `Kimi K2.5 Turbo (Fire Pass)` باشد. اگر `FIREWORKS_API_KEY` قابل حل نباشد، `openclaw models status --json` اعتبارنامه گمشده را زیر `auth.unusableProfiles` گزارش می‌کند.

  </Step>
</Steps>

## راه‌اندازی غیرتعاملی

برای نصب‌های اسکریپتی یا CI، همه چیز را در خط فرمان پاس دهید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## کاتالوگ داخلی

| ارجاع مدل                                              | نام                        | ورودی        | بافت | حداکثر خروجی | تفکر             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | متن + تصویر | 262,144 | 262,144    | اجبارا خاموش           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | متن + تصویر | 256,000 | 256,000    | اجبارا خاموش (پیش‌فرض) |

<Note>
  OpenClaw همه مدل‌های Fireworks Kimi را روی `thinking: off` ثابت می‌کند، چون Fireworks پارامترهای تفکر Kimi را در محیط تولید رد می‌کند. مسیریابی همان مدل مستقیما از طریق [Moonshot](/fa/providers/moonshot)، خروجی استدلال Kimi را حفظ می‌کند. برای جابه‌جایی بین ارائه‌دهنده‌ها، [حالت‌های تفکر](/fa/tools/thinking) را ببینید.
</Note>

## شناسه‌های مدل سفارشی Fireworks

OpenClaw هر مدل یا شناسه روتر Fireworks را در زمان اجرا می‌پذیرد. از شناسه دقیق نمایش‌داده‌شده توسط Fireworks استفاده کنید و آن را با `fireworks/` شروع کنید. حل‌وفصل پویا، قالب Fire Pass را شبیه‌سازی می‌کند (ورودی متن + تصویر، API سازگار با OpenAI، هزینه پیش‌فرض صفر) و وقتی شناسه با الگوی Kimi مطابقت داشته باشد، تفکر را خودکار غیرفعال می‌کند. شناسه‌های پویای GLM فقط متنی علامت‌گذاری می‌شوند، مگر اینکه یک ورودی مدل سفارشی با ورودی تصویر پیکربندی کنید.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="How model id prefixing works">
    هر ارجاع مدل Fireworks در OpenClaw با `fireworks/` شروع می‌شود و سپس شناسه دقیق یا مسیر روتر از پلتفرم Fireworks می‌آید. برای مثال:

    - مدل روتر: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - مدل مستقیم: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw هنگام ساخت درخواست API، پیشوند `fireworks/` را حذف می‌کند و مسیر باقی‌مانده را به‌عنوان فیلد `model` سازگار با OpenAI به endpoint Fireworks می‌فرستد.

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    اگر درخواست دارای پارامترهای `reasoning_*` باشد، Fireworks K2.6 خطای 400 برمی‌گرداند، با اینکه Kimi از طریق API خود Moonshot از تفکر پشتیبانی می‌کند. سیاست ارائه‌دهنده (`extensions/fireworks/thinking-policy.ts`) برای شناسه‌های مدل Kimi فقط سطح تفکر `off` را اعلام می‌کند، بنابراین جابه‌جایی‌های دستی `/think` و سطح‌های سیاست ارائه‌دهنده با قرارداد زمان اجرا همسو می‌مانند.

    برای استفاده سرتاسری از استدلال Kimi، [ارائه‌دهنده Moonshot](/fa/providers/moonshot) را پیکربندی کنید و همان مدل را از طریق آن مسیریابی کنید.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    اگر Gateway به‌صورت یک سرویس مدیریت‌شده اجرا می‌شود (launchd، systemd، Docker)، کلید Fireworks باید برای همان فرایند قابل مشاهده باشد، نه فقط برای shell تعاملی شما.

    <Warning>
      کلیدی که فقط در یک shell تعاملی export شده باشد، به daemon مربوط به launchd یا systemd کمکی نمی‌کند، مگر اینکه آن محیط آنجا هم import شده باشد. کلید را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا از فرایند gateway قابل خواندن باشد.
    </Warning>

    در macOS، `openclaw gateway install` از قبل `~/.openclaw/.env` را به فایل محیط LaunchAgent وصل می‌کند. پس از چرخاندن کلید، نصب را دوباره اجرا کنید (یا `openclaw doctor --fix` را اجرا کنید).

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model providers" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Thinking modes" href="/fa/tools/thinking" icon="brain">
    سطح‌های `/think`، سیاست‌های ارائه‌دهنده، و مسیریابی مدل‌های دارای قابلیت استدلال.
  </Card>
  <Card title="Moonshot" href="/fa/providers/moonshot" icon="moon">
    Kimi را با خروجی تفکر بومی از طریق API خود Moonshot اجرا کنید.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
