---
read_when:
    - می‌خواهید از Fireworks با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API سرویس Fireworks یا شناسهٔ مدل پیش‌فرض نیاز دارید
    - شما در حال اشکال‌زدایی رفتار Kimi در حالت خاموش بودن تفکر روی Fireworks هستید
summary: راه‌اندازی Fireworks (احراز هویت + انتخاب مدل)
title: فایروُرکس
x-i18n:
    generated_at: "2026-07-12T10:43:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) مدل‌های با وزن‌های باز و مدل‌های مسیریابی‌شده را از طریق یک API سازگار با OpenAI ارائه می‌کند. برای استفاده از دو مدل Kimi ازپیش‌فهرست‌شده و هر شناسهٔ مدل یا مسیریاب Fireworks در زمان اجرا، Plugin رسمی ارائه‌دهندهٔ Fireworks را نصب کنید.

| ویژگی                | مقدار                                                  |
| -------------------- | ------------------------------------------------------ |
| شناسهٔ ارائه‌دهنده   | `fireworks` (نام مستعار: `fireworks-ai`)               |
| بسته                  | `@openclaw/fireworks-provider`                         |
| متغیر محیطی احراز هویت | `FIREWORKS_API_KEY`                                  |
| پرچم راه‌اندازی      | `--auth-choice fireworks-api-key`                      |
| پرچم مستقیم CLI      | `--fireworks-api-key <key>`                            |
| API                   | سازگار با OpenAI (`openai-completions`)                |
| نشانی پایه            | `https://api.fireworks.ai/inference/v1`                |
| مدل پیش‌فرض           | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| نام مستعار پیش‌فرض   | `Kimi K2.5 Turbo`                                      |

## شروع به کار

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="تنظیم کلید API مربوط به Fireworks">
    <CodeGroup>

```bash راه‌اندازی
openclaw onboard --auth-choice fireworks-api-key
```

```bash پرچم مستقیم
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash فقط متغیر محیطی
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    فرایند راه‌اندازی، کلید را برای ارائه‌دهندهٔ `fireworks` در نمایه‌های احراز هویت شما ذخیره می‌کند و مسیریاب Kimi K2.5 Turbo با **Fire Pass** را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.

  </Step>
  <Step title="بررسی دردسترس‌بودن مدل">
    ```bash
    openclaw models list --provider fireworks
    ```

    فهرست باید شامل `Kimi K2.6` و `Kimi K2.5 Turbo (Fire Pass)` باشد. اگر `FIREWORKS_API_KEY` قابل دریافت نباشد، `openclaw models status --json` اعتبارنامهٔ مفقود را در `auth.unusableProfiles` گزارش می‌کند.

  </Step>
</Steps>

## راه‌اندازی غیرتعاملی

برای نصب‌های اسکریپتی یا CI، همه‌چیز را در خط فرمان وارد کنید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## فهرست داخلی

| ارجاع مدل                                              | نام                         | ورودی       | زمینه   | حداکثر خروجی | تفکر                    |
| ------------------------------------------------------ | --------------------------- | ----------- | ------- | ------------ | ----------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | متن + تصویر | 262,144 | 262,144      | اجباری غیرفعال          |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | متن + تصویر | 256,000 | 256,000      | اجباری غیرفعال (پیش‌فرض) |

<Note>
  OpenClaw همهٔ مدل‌های Kimi در Fireworks را روی `thinking: off` ثابت می‌کند، زیرا Kimi در Fireworks ممکن است زنجیرهٔ تفکر را در پاسخ قابل‌مشاهده افشا کند، مگر اینکه درخواست به‌صراحت تفکر را غیرفعال کند. مسیریابی مستقیم همان مدل از طریق [Moonshot](/fa/providers/moonshot)، خروجی استدلال Kimi را حفظ می‌کند. برای جابه‌جایی میان ارائه‌دهندگان، [حالت‌های تفکر](/fa/tools/thinking) را ببینید.
</Note>

## شناسه‌های سفارشی مدل Fireworks

OpenClaw در زمان اجرا هر شناسهٔ مدل یا مسیریاب Fireworks را می‌پذیرد. از شناسهٔ دقیق نمایش‌داده‌شده در Fireworks استفاده کنید و پیشوند `fireworks/` را به آن بیفزایید. تفکیک پویا، الگوی Fire Pass را شبیه‌سازی می‌کند (ورودی متن + تصویر، API سازگار با OpenAI و هزینهٔ پیش‌فرض صفر) و هنگامی که شناسه با الگوی Kimi مطابقت داشته باشد، تفکر را به‌صورت خودکار غیرفعال می‌کند. شناسه‌های پویای GLM فقط‌متنی علامت‌گذاری می‌شوند، مگر اینکه یک ورودی مدل سفارشی با ورودی تصویر پیکربندی کنید.

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
  <Accordion title="نحوهٔ کار پیشوندگذاری شناسهٔ مدل">
    هر ارجاع مدل Fireworks در OpenClaw با `fireworks/` آغاز می‌شود و پس از آن، شناسهٔ دقیق یا مسیر مسیریاب از پلتفرم Fireworks قرار می‌گیرد. برای نمونه:

    - مدل مسیریاب: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - مدل مستقیم: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw هنگام ساخت درخواست API، پیشوند `fireworks/` را حذف می‌کند و مسیر باقی‌مانده را به‌عنوان فیلد سازگار با OpenAI یعنی `model` به نقطهٔ پایانی Fireworks می‌فرستد.

  </Accordion>

  <Accordion title="دلیل غیرفعال‌سازی اجباری تفکر برای Kimi">
    Fireworks مدل Kimi را بدون کانال استدلال جداگانه ارائه می‌کند؛ بنابراین ممکن است زنجیرهٔ تفکر در جریان قابل‌مشاهدهٔ `content` ظاهر شود. OpenClaw در هر درخواست Kimi به Fireworks، مقدار `thinking: { type: "disabled" }` را می‌فرستد و `reasoning`، `reasoning_effort` و `reasoningEffort` را از محموله حذف می‌کند (`extensions/fireworks/stream.ts`). سیاست ارائه‌دهنده (`extensions/fireworks/thinking-policy.ts`) برای شناسه‌های مدل Kimi فقط سطح تفکر `off` را اعلام می‌کند تا تغییرات دستی `/think` و سطوح سیاست ارائه‌دهنده با قرارداد زمان اجرا هم‌راستا بمانند.

    برای استفادهٔ سرتاسری از استدلال Kimi، [ارائه‌دهندهٔ Moonshot](/fa/providers/moonshot) را پیکربندی کنید و همان مدل را از طریق آن مسیریابی کنید.

  </Accordion>

  <Accordion title="دردسترس‌بودن محیط برای سرویس پس‌زمینه">
    اگر Gateway به‌صورت یک سرویس مدیریت‌شده اجرا می‌شود (launchd، systemd یا Docker)، کلید Fireworks باید برای همان فرایند قابل‌مشاهده باشد، نه فقط برای پوستهٔ تعاملی شما.

    <Warning>
      کلیدی که فقط در یک پوستهٔ تعاملی صادر شده باشد، برای سرویس پس‌زمینهٔ launchd یا systemd مفید نخواهد بود، مگر اینکه آن محیط نیز در سرویس وارد شود. برای اینکه کلید از فرایند Gateway قابل‌خواندن باشد، آن را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید.
    </Warning>

    OpenClaw هنگام بارگذاری پیکربندی، `~/.openclaw/.env` را بارگذاری می‌کند؛ بنابراین کلیدهای ذخیره‌شده در آن، در همهٔ پلتفرم‌ها به سرویس‌های مدیریت‌شدهٔ Gateway می‌رسند. پس از تعویض کلید، Gateway را مجدداً راه‌اندازی کنید (یا دوباره `openclaw doctor --fix` را اجرا کنید).

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ارائه‌دهندگان مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل و رفتار جایگزینی هنگام خرابی.
  </Card>
  <Card title="حالت‌های تفکر" href="/fa/tools/thinking" icon="brain">
    سطوح `/think`، سیاست‌های ارائه‌دهنده و مسیریابی مدل‌های دارای قابلیت استدلال.
  </Card>
  <Card title="Moonshot" href="/fa/providers/moonshot" icon="moon">
    اجرای Kimi با خروجی تفکر بومی از طریق API اختصاصی Moonshot.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
