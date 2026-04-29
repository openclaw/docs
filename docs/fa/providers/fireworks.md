---
read_when:
    - می‌خواهید از Fireworks همراه با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API Fireworks یا شناسهٔ مدل پیش‌فرض نیاز دارید
summary: راه‌اندازی Fireworks (احراز هویت + انتخاب مدل)
title: آتش‌بازی
x-i18n:
    generated_at: "2026-04-29T23:25:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 66ad831b9a04897c8850f28d246ec6c1efe1006c2a7f59295a8a78746c78e645
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) مدل‌های با وزن باز و مسیریابی‌شده را از طریق یک API سازگار با OpenAI ارائه می‌کند. OpenClaw شامل یک Plugin ارائه‌دهنده Fireworks به‌صورت بسته‌بندی‌شده است.

| ویژگی          | مقدار                                                  |
| ------------- | ------------------------------------------------------ |
| ارائه‌دهنده    | `fireworks`                                            |
| احراز هویت     | `FIREWORKS_API_KEY`                                    |
| API           | چت/تکمیل‌های سازگار با OpenAI                          |
| نشانی پایه     | `https://api.fireworks.ai/inference/v1`                |
| مدل پیش‌فرض    | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## شروع به کار

<Steps>
  <Step title="راه‌اندازی احراز هویت Fireworks از طریق راه‌اندازی اولیه">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    این کار کلید Fireworks شما را در پیکربندی OpenClaw ذخیره می‌کند و مدل آغازین Fire Pass را به‌عنوان پیش‌فرض تنظیم می‌کند.

  </Step>
  <Step title="تأیید در دسترس بودن مدل">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## نمونه غیرتعاملی

برای راه‌اندازی‌های اسکریپتی یا CI، همه مقادیر را در خط فرمان وارد کنید:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## کاتالوگ داخلی

| مرجع مدل                                               | نام                         | ورودی       | زمینه  | بیشینه خروجی | یادداشت‌ها                                                                                                                                                 |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144    | جدیدترین مدل Kimi در Fireworks. برای درخواست‌های Fireworks K2.6، حالت تفکر غیرفعال است؛ اگر به خروجی تفکر Kimi نیاز دارید، مستقیماً از طریق Moonshot مسیریابی کنید. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000    | مدل آغازین پیش‌فرض بسته‌بندی‌شده در Fireworks                                                                                                         |

<Tip>
اگر Fireworks مدل جدیدتری مانند انتشار تازه Qwen یا Gemma منتشر کند، می‌توانید بدون انتظار برای به‌روزرسانی کاتالوگ بسته‌بندی‌شده، مستقیماً با استفاده از شناسه مدل Fireworks آن به آن تغییر دهید.
</Tip>

## شناسه‌های مدل سفارشی Fireworks

OpenClaw شناسه‌های مدل پویای Fireworks را نیز می‌پذیرد. از همان شناسه دقیق مدل یا مسیریاب که Fireworks نشان می‌دهد استفاده کنید و پیشوند `fireworks/` را به آن اضافه کنید.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="نحوه کار پیشوندگذاری شناسه مدل">
    هر مرجع مدل Fireworks در OpenClaw با `fireworks/` شروع می‌شود و پس از آن شناسه دقیق یا مسیر مسیریاب از پلتفرم Fireworks می‌آید. برای مثال:

    - مدل مسیریاب: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - مدل مستقیم: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw هنگام ساخت درخواست API، پیشوند `fireworks/` را حذف می‌کند و مسیر باقی‌مانده را به نقطه پایانی Fireworks می‌فرستد.

  </Accordion>

  <Accordion title="یادداشت محیط">
    اگر Gateway بیرون از پوسته تعاملی شما اجرا می‌شود، مطمئن شوید `FIREWORKS_API_KEY` برای آن فرایند نیز در دسترس است.

    <Warning>
    کلیدی که فقط در `~/.profile` قرار دارد، به یک سرویس launchd/systemd کمکی نمی‌کند مگر اینکه آن محیط نیز در آنجا وارد شده باشد. کلید را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا مطمئن شوید فرایند Gateway می‌تواند آن را بخواند.
    </Warning>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل و رفتار جایگزینی هنگام خطا.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    عیب‌یابی عمومی و پرسش‌های متداول.
  </Card>
</CardGroup>
