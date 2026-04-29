---
read_when:
    - می‌خواهید از مدل‌های باز در OpenClaw به‌صورت رایگان استفاده کنید
    - باید NVIDIA_API_KEY را تنظیم کنید
summary: استفاده از رابط برنامه‌نویسی کاربردی سازگار با OpenAI شرکت NVIDIA در OpenClaw
title: NVIDIA
x-i18n:
    generated_at: "2026-04-29T23:27:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 297cc25cf5235bb51f3962c2a1b8799ca6544d57e701c42e9b1e1c7d881ad32b
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA یک API سازگار با OpenAI را در `https://integrate.api.nvidia.com/v1` برای
مدل‌های باز به‌صورت رایگان ارائه می‌کند. با یک کلید API از
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) احراز هویت کنید.

## شروع به کار

<Steps>
  <Step title="کلید API خود را دریافت کنید">
    یک کلید API در [build.nvidia.com](https://build.nvidia.com/settings/api-keys) بسازید.
  </Step>
  <Step title="کلید را اکسپورت کنید و راه‌اندازی اولیه را اجرا کنید">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="یک مدل NVIDIA تنظیم کنید">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
اگر به‌جای متغیر محیطی، `--nvidia-api-key` را ارسال کنید، مقدار آن در تاریخچه‌ی shell
و خروجی `ps` قرار می‌گیرد. در صورت امکان، متغیر محیطی `NVIDIA_API_KEY` را ترجیح دهید.
</Warning>

برای راه‌اندازی غیرتعاملی، می‌توانید کلید را مستقیما نیز ارسال کنید:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## نمونه پیکربندی

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## کاتالوگ داخلی

| مرجع مدل                                   | نام                          | زمینه  | حداکثر خروجی |
| ------------------------------------------ | ---------------------------- | ------- | ------------ |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192        |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192        |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192        |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192        |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="رفتار فعال‌سازی خودکار">
    وقتی متغیر محیطی `NVIDIA_API_KEY` تنظیم شده باشد، ارائه‌دهنده به‌طور خودکار فعال می‌شود.
    فراتر از کلید، هیچ پیکربندی صریحی برای ارائه‌دهنده لازم نیست.
  </Accordion>

  <Accordion title="کاتالوگ و قیمت‌گذاری">
    کاتالوگ همراه، ایستا است. هزینه‌ها در منبع به‌طور پیش‌فرض `0` هستند، چون NVIDIA
    در حال حاضر دسترسی رایگان API را برای مدل‌های فهرست‌شده ارائه می‌کند.
  </Accordion>

  <Accordion title="نقطه پایانی سازگار با OpenAI">
    NVIDIA از نقطه پایانی استاندارد تکمیل‌های `/v1` استفاده می‌کند. هر ابزار سازگار با OpenAI
    باید با URL پایه NVIDIA بدون نیاز به تنظیمات اضافه کار کند.
  </Accordion>
</AccordionGroup>

<Tip>
در حال حاضر استفاده از مدل‌های NVIDIA رایگان است. برای آخرین وضعیت دسترس‌پذیری و
جزئیات محدودیت نرخ، [build.nvidia.com](https://build.nvidia.com/) را بررسی کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل، و رفتار جایگزینی هنگام خطا.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها، و ارائه‌دهندگان.
  </Card>
</CardGroup>
