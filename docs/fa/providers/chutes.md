---
read_when:
    - می‌خواهید از Chutes همراه با OpenClaw استفاده کنید
    - به مسیر راه‌اندازی OAuth یا کلید API نیاز دارید
    - وقتی مدل پیش‌فرض، نام‌های مستعار، یا رفتار کشف را می‌خواهید
summary: راه‌اندازی Chutes (OAuth یا کلید API، کشف مدل، نام‌های مستعار)
title: Chutes
x-i18n:
    generated_at: "2026-04-29T23:23:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 52e2c767604ff50cc7fe1a5fcfac03c35345facf2225e80f62476bbc3852199a
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) کاتالوگ‌های مدل متن‌باز را از طریق یک API
سازگار با OpenAI ارائه می‌کند. OpenClaw هم از احراز هویت OAuth در مرورگر و هم از احراز هویت مستقیم با کلید API
برای ارائه‌دهنده همراه `chutes` پشتیبانی می‌کند.

| ویژگی | مقدار                        |
| -------- | ---------------------------- |
| ارائه‌دهنده | `chutes`                     |
| API      | سازگار با OpenAI            |
| URL پایه | `https://llm.chutes.ai/v1`   |
| احراز هویت     | OAuth یا کلید API (پایین را ببینید) |

## شروع به کار

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Run the OAuth onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw جریان مرورگر را به‌صورت محلی اجرا می‌کند، یا روی میزبان‌های راه‌دور/بدون رابط گرافیکی یک URL + جریان جای‌گذاری تغییرمسیر
        نشان می‌دهد. توکن‌های OAuth از طریق پروفایل‌های احراز هویت OpenClaw به‌صورت خودکار تازه‌سازی می‌شوند.
      </Step>
      <Step title="Verify the default model">
        پس از راه‌اندازی اولیه، مدل پیش‌فرض روی
        `chutes/zai-org/GLM-4.7-TEE` تنظیم می‌شود و کاتالوگ همراه Chutes
        ثبت می‌شود.
      </Step>
    </Steps>
  </Tab>
  <Tab title="API key">
    <Steps>
      <Step title="Get an API key">
        یک کلید در
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys) بسازید.
      </Step>
      <Step title="Run the API key onboarding flow">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
      <Step title="Verify the default model">
        پس از راه‌اندازی اولیه، مدل پیش‌فرض روی
        `chutes/zai-org/GLM-4.7-TEE` تنظیم می‌شود و کاتالوگ همراه Chutes
        ثبت می‌شود.
      </Step>
    </Steps>
  </Tab>
</Tabs>

<Note>
هر دو مسیر احراز هویت کاتالوگ همراه Chutes را ثبت می‌کنند و مدل پیش‌فرض را روی
`chutes/zai-org/GLM-4.7-TEE` تنظیم می‌کنند. متغیرهای محیط اجرای زمان اجرا: `CHUTES_API_KEY`,
`CHUTES_OAUTH_TOKEN`.
</Note>

## رفتار کشف

وقتی احراز هویت Chutes در دسترس باشد، OpenClaw کاتالوگ Chutes را با همان
اعتبارنامه پرس‌وجو می‌کند و از مدل‌های کشف‌شده استفاده می‌کند. اگر کشف ناموفق باشد، OpenClaw
به یک کاتالوگ ایستای همراه بازمی‌گردد تا راه‌اندازی اولیه و شروع به کار همچنان کار کنند.

## نام‌های مستعار پیش‌فرض

OpenClaw سه نام مستعار کاربردی برای کاتالوگ همراه Chutes ثبت می‌کند:

| نام مستعار           | مدل هدف                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## کاتالوگ آغازین داخلی

کاتالوگ پشتیبان همراه شامل ارجاع‌های فعلی Chutes است:

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

## نمونه پیکربندی

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
  <Accordion title="OAuth overrides">
    می‌توانید جریان OAuth را با متغیرهای محیطی اختیاری سفارشی کنید:

    | متغیر | هدف |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | شناسه کلاینت OAuth سفارشی |
    | `CHUTES_CLIENT_SECRET` | راز کلاینت OAuth سفارشی |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI تغییرمسیر سفارشی |
    | `CHUTES_OAUTH_SCOPES` | دامنه‌های OAuth سفارشی |

    برای نیازمندی‌های برنامه تغییرمسیر و راهنما، [مستندات OAuth Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    را ببینید.

  </Accordion>

  <Accordion title="Notes">
    - کشف با کلید API و OAuth هر دو از همان شناسه ارائه‌دهنده `chutes` استفاده می‌کنند.
    - مدل‌های Chutes با قالب `chutes/<model-id>` ثبت می‌شوند.
    - اگر کشف هنگام شروع به کار ناموفق باشد، کاتالوگ ایستای همراه به‌صورت خودکار استفاده می‌شود.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    قواعد ارائه‌دهنده، ارجاع‌های مدل، و رفتار جابه‌جایی هنگام خرابی.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    طرح‌واره کامل پیکربندی شامل تنظیمات ارائه‌دهنده.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    داشبورد و مستندات API برای Chutes.
  </Card>
  <Card title="Chutes API keys" href="https://chutes.ai/settings/api-keys" icon="key">
    کلیدهای API برای Chutes را بسازید و مدیریت کنید.
  </Card>
</CardGroup>
