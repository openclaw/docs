---
read_when:
    - می‌خواهید از مدل‌های باز در OpenClaw به‌صورت رایگان استفاده کنید
    - باید NVIDIA_API_KEY تنظیم شده باشد
summary: از API سازگار با OpenAI شرکت NVIDIA در OpenClaw استفاده کنید
title: NVIDIA
x-i18n:
    generated_at: "2026-05-07T13:30:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8846c51b056e05f8552b3804d4dac73ff34aa874ec3d5d6fb13fad5a4112bc7f
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA یک API سازگار با OpenAI در `https://integrate.api.nvidia.com/v1` برای
مدل‌های باز به‌صورت رایگان ارائه می‌دهد. با یک کلید API از
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) احراز هویت کنید.

## شروع به کار

<Steps>
  <Step title="کلید API خود را دریافت کنید">
    یک کلید API در [build.nvidia.com](https://build.nvidia.com/settings/api-keys) بسازید.
  </Step>
  <Step title="کلید را export کنید و راه‌اندازی اولیه را اجرا کنید">
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
اگر به‌جای متغیر محیطی، `--nvidia-api-key` را ارسال کنید، مقدار آن در تاریخچهٔ shell
و خروجی `ps` قرار می‌گیرد. در صورت امکان متغیر محیطی `NVIDIA_API_KEY` را ترجیح دهید.
</Warning>

برای راه‌اندازی غیرتعاملی، می‌توانید کلید را مستقیماً هم ارسال کنید:

```bash
openclaw onboard --auth-choice nvidia-api-key --nvidia-api-key "nvapi-..."
```

## نمونهٔ پیکربندی

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

| مرجع مدل                                   | نام                          | بافت    | بیشینهٔ خروجی |
| ------------------------------------------ | ---------------------------- | ------- | ------------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192         |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192         |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192         |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192         |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="رفتار فعال‌سازی خودکار">
    وقتی متغیر محیطی `NVIDIA_API_KEY` تنظیم شده باشد، ارائه‌دهنده به‌صورت خودکار فعال می‌شود.
    فراتر از کلید، هیچ پیکربندی صریحی برای ارائه‌دهنده لازم نیست.
  </Accordion>

  <Accordion title="کاتالوگ و قیمت‌گذاری">
    کاتالوگ همراه، ایستا است. از آنجا که NVIDIA در حال حاضر برای مدل‌های فهرست‌شده
    دسترسی رایگان به API ارائه می‌دهد، هزینه‌ها در منبع به‌صورت پیش‌فرض `0` هستند.
  </Accordion>

  <Accordion title="نقطهٔ پایانی سازگار با OpenAI">
    NVIDIA از نقطهٔ پایانی استاندارد تکمیل‌های `/v1` استفاده می‌کند. هر ابزار سازگار با OpenAI
    باید با URL پایهٔ NVIDIA بدون نیاز به تنظیمات اضافی کار کند.
  </Accordion>

  <Accordion title="پاسخ‌های کند ارائه‌دهندهٔ سفارشی">
    برخی مدل‌های سفارشی میزبانی‌شده توسط NVIDIA ممکن است پیش از انتشار نخستین قطعهٔ پاسخ،
    بیش از watchdog پیش‌فرض بیکاری مدل زمان ببرند. برای ورودی‌های ارائه‌دهندهٔ سفارشی NVIDIA،
    به‌جای افزایش timeout کل زمان اجرای عامل، timeout ارائه‌دهنده را افزایش دهید:

    ```json5
    {
      models: {
        providers: {
          "custom-integrate-api-nvidia-com": {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            apiKey: "NVIDIA_API_KEY",
            timeoutSeconds: 300,
          },
        },
      },
      agents: {
        defaults: {
          models: {
            "custom-integrate-api-nvidia-com/meta/llama-3.1-70b-instruct": {
              params: { thinking: "off" },
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

<Tip>
مدل‌های NVIDIA در حال حاضر رایگان هستند. برای آخرین جزئیات دربارهٔ دسترس‌پذیری و
محدودیت نرخ، [build.nvidia.com](https://build.nvidia.com/) را بررسی کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، مراجع مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها، و ارائه‌دهندگان.
  </Card>
</CardGroup>
