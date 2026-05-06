---
read_when:
    - می‌خواهید از Fireworks با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API Fireworks یا شناسهٔ مدل پیش‌فرض نیاز دارید
    - شما در حال اشکال‌زدایی رفتار Kimi با تفکر خاموش روی Fireworks هستید
summary: راه‌اندازی Fireworks (احراز هویت + انتخاب مدل)
title: Fireworks
x-i18n:
    generated_at: "2026-05-06T09:38:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) مدل‌های open-weight و routed را از طریق API سازگار با OpenAI ارائه می‌کند. OpenClaw شامل یک Plugin ارائه‌دهنده Fireworks همراه است که با دو مدل Kimi از پیش فهرست‌شده عرضه می‌شود و در زمان اجرا هر مدل Fireworks یا شناسه router را می‌پذیرد.

| ویژگی        | مقدار                                                  |
| --------------- | ------------------------------------------------------ |
| شناسه ارائه‌دهنده     | `fireworks` (نام مستعار: `fireworks-ai`)                    |
| Plugin          | همراه، `enabledByDefault: true`                      |
| متغیر محیطی احراز هویت    | `FIREWORKS_API_KEY`                                    |
| فلگ راه‌اندازی اولیه | `--auth-choice fireworks-api-key`                      |
| فلگ مستقیم CLI | `--fireworks-api-key <key>`                            |
| API             | سازگار با OpenAI (`openai-completions`)               |
| URL پایه        | `https://api.fireworks.ai/inference/v1`                |
| مدل پیش‌فرض   | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| نام مستعار پیش‌فرض   | `Kimi K2.5 Turbo`                                      |

## شروع به کار

<Steps>
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

    راه‌اندازی اولیه کلید را برای ارائه‌دهنده `fireworks` در پروفایل‌های احراز هویت شما ذخیره می‌کند و router مدل Kimi K2.5 Turbo **Fire Pass** را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.

  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider fireworks
    ```

    فهرست باید شامل `Kimi K2.6` و `Kimi K2.5 Turbo (Fire Pass)` باشد. اگر `FIREWORKS_API_KEY` قابل حل نباشد، `openclaw models status --json` اعتبارنامه مفقود را زیر `auth.unusableProfiles` گزارش می‌کند.

  </Step>
</Steps>

## راه‌اندازی غیرتعاملی

برای نصب‌های اسکریپتی یا CI، همه چیز را در خط فرمان ارسال کنید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## فهرست داخلی

| مرجع مدل                                              | نام                        | ورودی        | زمینه | حداکثر خروجی | تفکر             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ---------- | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | متن + تصویر | 262,144 | 262,144    | اجباراً خاموش           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | متن + تصویر | 256,000 | 256,000    | اجباراً خاموش (پیش‌فرض) |

<Note>
  OpenClaw همه مدل‌های Fireworks Kimi را روی `thinking: off` پین می‌کند، زیرا Fireworks پارامترهای تفکر Kimi را در محیط تولید رد می‌کند. مسیریابی همان مدل مستقیماً از طریق [Moonshot](/fa/providers/moonshot) خروجی استدلال Kimi را حفظ می‌کند. برای جابه‌جایی بین ارائه‌دهنده‌ها، [حالت‌های تفکر](/fa/tools/thinking) را ببینید.
</Note>

## شناسه‌های مدل سفارشی Fireworks

OpenClaw هر مدل Fireworks یا شناسه router را در زمان اجرا می‌پذیرد. از شناسه دقیق نمایش‌داده‌شده توسط Fireworks استفاده کنید و پیشوند `fireworks/` را به آن اضافه کنید. حل پویای مدل، قالب Fire Pass را شبیه‌سازی می‌کند (ورودی متن + تصویر، API سازگار با OpenAI، هزینه پیش‌فرض صفر) و وقتی شناسه با الگوی Kimi مطابقت داشته باشد، تفکر را به‌صورت خودکار غیرفعال می‌کند.

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
    هر مرجع مدل Fireworks در OpenClaw با `fireworks/` شروع می‌شود و پس از آن شناسه دقیق یا مسیر router از پلتفرم Fireworks می‌آید. برای مثال:

    - مدل router: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - مدل مستقیم: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw هنگام ساخت درخواست API پیشوند `fireworks/` را حذف می‌کند و مسیر باقی‌مانده را به‌عنوان فیلد `model` سازگار با OpenAI به endpoint Fireworks می‌فرستد.

  </Accordion>

  <Accordion title="Why thinking is forced off for Kimi">
    اگر درخواست شامل پارامترهای `reasoning_*` باشد، Fireworks K2.6 خطای 400 برمی‌گرداند، حتی با اینکه Kimi از تفکر از طریق API خود Moonshot پشتیبانی می‌کند. سیاست همراه (`extensions/fireworks/thinking-policy.ts`) برای شناسه‌های مدل Kimi فقط سطح تفکر `off` را اعلام می‌کند، بنابراین سوییچ‌های دستی `/think` و سطح‌های سیاست ارائه‌دهنده با قرارداد زمان اجرا هم‌راستا می‌مانند.

    برای استفاده سرتاسری از استدلال Kimi، [ارائه‌دهنده Moonshot](/fa/providers/moonshot) را پیکربندی کنید و همان مدل را از طریق آن مسیریابی کنید.

  </Accordion>

  <Accordion title="Environment availability for the daemon">
    اگر Gateway به‌عنوان یک سرویس مدیریت‌شده اجرا شود (launchd، systemd، Docker)، کلید Fireworks باید برای همان فرایند قابل مشاهده باشد؛ نه فقط برای پوسته تعاملی شما.

    <Warning>
      کلیدی که فقط در `~/.profile` قرار دارد، به daemon مربوط به launchd یا systemd کمکی نمی‌کند مگر اینکه آن محیط نیز در آنجا وارد شده باشد. کلید را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا از فرایند gateway قابل خواندن باشد.
    </Warning>

    در macOS، `openclaw gateway install` از قبل `~/.openclaw/.env` را به فایل محیط LaunchAgent متصل می‌کند. پس از چرخش کلید، نصب را دوباره اجرا کنید (یا `openclaw doctor --fix` را اجرا کنید).

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model providers" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهنده‌ها، مراجع مدل، و رفتار failover.
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
