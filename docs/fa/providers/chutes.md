---
read_when:
    - می‌خواهید از Chutes با OpenClaw استفاده کنید
    - به مسیر راه‌اندازی OAuth یا کلید API نیاز دارید
    - مدل پیش‌فرض، نام‌های مستعار یا رفتار کشف را می‌خواهید
summary: راه‌اندازی Chutes (OAuth یا کلید API، کشف مدل، نام‌های مستعار)
title: چوتس
x-i18n:
    generated_at: "2026-07-12T10:39:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) فهرست‌های مدل‌های متن‌باز را از طریق یک API سازگار با OpenAI ارائه می‌کند. OpenClaw هم از OAuth مرورگر و هم از احراز هویت با کلید API پشتیبانی می‌کند.

| ویژگی                   | مقدار                                                   |
| ----------------------- | ------------------------------------------------------- |
| ارائه‌دهنده             | `chutes`                                                |
| Plugin                  | بستهٔ خارجی رسمی (`@openclaw/chutes-provider`)          |
| API                     | سازگار با OpenAI                                        |
| نشانی پایه              | `https://llm.chutes.ai/v1`                              |
| احراز هویت              | OAuth یا کلید API (پایین را ببینید)                     |
| متغیرهای محیطی زمان اجرا | `CHUTES_API_KEY`، `CHUTES_OAUTH_TOKEN`                  |

`CHUTES_OAUTH_TOKEN` یک توکن دسترسی OAuth را که از قبل دریافت شده است، مستقیماً ارائه می‌کند
(برای مثال در CI) و جریان تعاملی مرورگر در ادامه را دور می‌زند.

## نصب Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## شروع به کار

هر دو مسیر، مدل پیش‌فرض را روی `chutes/zai-org/GLM-4.7-TEE` تنظیم و
فهرست Chutes را ثبت می‌کنند.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="اجرای جریان راه‌اندازی OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw جریان مرورگر را به‌صورت محلی اجرا می‌کند، یا در میزبان‌های راه‌دور/بدون رابط گرافیکی
        یک نشانی اینترنتی همراه با جریان جای‌گذاری تغییرمسیر نشان می‌دهد. توکن‌های OAuth از طریق نمایه‌های
        احراز هویت OpenClaw به‌طور خودکار تازه‌سازی می‌شوند.
      </Step>
    </Steps>
  </Tab>
  <Tab title="کلید API">
    <Steps>
      <Step title="دریافت کلید API">
        در
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys)
        یک کلید ایجاد کنید.
      </Step>
      <Step title="اجرای جریان راه‌اندازی کلید API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## رفتار کشف

هنگامی که احراز هویت Chutes در دسترس باشد، OpenClaw با استفاده از آن
اعتبارنامه، `GET /v1/models` را فراخوانی می‌کند و مدل‌های کشف‌شده را به کار می‌گیرد؛
این مدل‌ها برای هر اعتبارنامه به‌مدت ۵ دقیقه در حافظهٔ نهان نگه‌داری می‌شوند.
در صورت منقضی یا غیرمجاز بودن کلید (HTTP 401)، OpenClaw یک بار دیگر
بدون اعتبارنامه تلاش می‌کند. اگر کشف همچنان هیچ ردیفی برنگرداند، ناموفق شود یا هر
وضعیت غیر 2xx دیگری برگرداند، به فهرست ایستای همراه بازمی‌گردد (کشف با کلید API
و OAuth هر دو از همین مسیر استفاده می‌کنند). اگر کشف هنگام راه‌اندازی ناموفق باشد،
فهرست ایستا به‌طور خودکار استفاده می‌شود.

## نام‌های مستعار پیش‌فرض

OpenClaw سه نام مستعار کاربردی برای فهرست Chutes ثبت می‌کند:

| نام مستعار       | مدل مقصد                                              |
| ---------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## فهرست آغازین داخلی

فهرست جایگزین همراه شامل ۴۷ مدل است. نمونه‌ای نماینده از ارجاع‌های فعلی:

| ارجاع مدل                                             |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

برای مشاهدهٔ فهرست کامل، `openclaw models list --all --provider chutes` را اجرا کنید.

## نمونهٔ پیکربندی

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="بازنویسی‌های OAuth">
    جریان OAuth را با متغیرهای محیطی اختیاری سفارشی کنید:

    | متغیر | کاربرد |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | شناسهٔ سرویس‌گیرندهٔ OAuth (اگر تنظیم نشده باشد، درخواست می‌شود) |
    | `CHUTES_CLIENT_SECRET` | راز سرویس‌گیرندهٔ OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI تغییرمسیر (پیش‌فرض `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | دامنه‌های جداشده با فاصله (پیش‌فرض `openid profile chutes:invoke`) |

    برای الزامات برنامهٔ تغییرمسیر و دریافت راهنمایی، [مستندات OAuth چوتس](https://chutes.ai/docs/sign-in-with-chutes/overview)
    را ببینید.

  </Accordion>

  <Accordion title="نکته‌ها">
    - مدل‌های Chutes به‌شکل `chutes/<model-id>` ثبت می‌شوند.
    - Chutes هنگام پخش جریانی، میزان مصرف توکن را گزارش نمی‌کند (`supportsUsageInStreaming: false`)؛ بااین‌حال، پس از تکمیل جریان، مجموع مصرف نمایش داده می‌شود.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    قواعد ارائه‌دهنده، ارجاع‌های مدل و رفتار انتقال خودکار در زمان خرابی.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌وارهٔ کامل پیکربندی، شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    داشبورد Chutes و مستندات API.
  </Card>
  <Card title="کلیدهای API ‏Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    کلیدهای API ‏Chutes را ایجاد و مدیریت کنید.
  </Card>
</CardGroup>
