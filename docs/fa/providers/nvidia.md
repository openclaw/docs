---
read_when:
    - می‌خواهید به‌صورت رایگان از مدل‌های باز در OpenClaw استفاده کنید
    - باید NVIDIA_API_KEY را تنظیم کرده باشید
    - می‌خواهید از Nemotron 3 Ultra از طریق NVIDIA استفاده کنید
summary: از API سازگار با OpenAI متعلق به NVIDIA در OpenClaw استفاده کنید
title: NVIDIA
x-i18n:
    generated_at: "2026-06-27T18:42:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e94b1d1ab19c6ddb6b26678d5342d55a2b9e9499f4058adbd462b15b9d9e7dd
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA یک API سازگار با OpenAI در `https://integrate.api.nvidia.com/v1` برای
مدل‌های باز به‌صورت رایگان ارائه می‌کند. با یک کلید API از
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) احراز هویت کنید. OpenClaw
ارائه‌دهنده NVIDIA را به‌طور پیش‌فرض روی Nemotron 3 Ultra، مدل استدلال فعال
550B کل / 55B متعلق به NVIDIA برای کارهای عاملی با زمینه بلند، تنظیم می‌کند.

## شروع به کار

<Steps>
  <Step title="کلید API خود را دریافت کنید">
    یک کلید API در [build.nvidia.com](https://build.nvidia.com/settings/api-keys) ایجاد کنید.
  </Step>
  <Step title="کلید را export کنید و onboarding را اجرا کنید">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="یک مدل NVIDIA تنظیم کنید">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
اگر به‌جای متغیر env، `--nvidia-api-key` را پاس بدهید، مقدار در تاریخچه shell
و خروجی `ps` قرار می‌گیرد. در صورت امکان، متغیر محیطی `NVIDIA_API_KEY` را ترجیح دهید.
</Warning>

برای راه‌اندازی غیرتعاملی، می‌توانید کلید را مستقیماً نیز پاس بدهید:

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
      model: { primary: "nvidia/nvidia/nemotron-3-ultra-550b-a55b" },
    },
  },
}
```

## کاتالوگ ویژه

وقتی یک کلید API برای NVIDIA پیکربندی شده باشد، مسیرهای راه‌اندازی و انتخاب مدل
در OpenClaw کاتالوگ عمومی مدل‌های ویژه NVIDIA را از
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` امتحان می‌کنند و
نتیجه رتبه‌بندی‌شده را برای 24 ساعت cache می‌کنند. بنابراین مدل‌های ویژه جدید از build.nvidia.com
بدون انتظار برای انتشار OpenClaw در سطح‌های راه‌اندازی و انتخاب مدل ظاهر می‌شوند.
وقتی feed زنده در دسترس باشد، اولین مدل برگشتی گزینه پیش‌فرضی است که هنگام
راه‌اندازی NVIDIA نمایش داده می‌شود.

دریافت داده از یک سیاست میزبان HTTPS ثابت برای `assets.ngc.nvidia.com` استفاده می‌کند. اگر هیچ
کلید API برای NVIDIA پیکربندی نشده باشد، یا اگر آن کاتالوگ عمومی در دسترس نباشد یا
بدشکل باشد، OpenClaw به کاتالوگ همراه و پیش‌فرض همراه زیر برمی‌گردد.

## Nemotron 3 Ultra

Nemotron 3 Ultra مدل پیش‌فرض NVIDIA در OpenClaw است. صفحه build متعلق به NVIDIA برای
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
آن را به‌عنوان یک endpoint رایگان در دسترس با مشخصه زمینه 1M-token فهرست می‌کند.
کاتالوگ همراه، بیشینه خروجی 16,384-token را ثبت می‌کند تا با درخواست نمونه فعلی
سازگار با OpenAI متعلق به NVIDIA برای endpoint میزبانی‌شده هم‌خوان باشد.

برای پیش‌فرض NVIDIA با بالاترین قابلیت از Ultra استفاده کنید. وقتی گزینه کوچک‌تر
Nemotron 3 را می‌خواهید، Super را انتخاب‌شده نگه دارید، یا وقتی زمینه، تاخیر یا رفتار
یکی از مدل‌های شخص ثالث میزبانی‌شده در کاتالوگ NVIDIA مناسب‌تر است، آن را انتخاب کنید.
ردیف Ultra همراه به‌طور پیش‌فرض `chat_template_kwargs.enable_thinking: false` و
`force_nonempty_content: true` را ارسال می‌کند تا خروجی معمول chat به‌جای افشای متن
استدلال، در پاسخ قابل مشاهده باقی بماند.

## کاتالوگ fallback همراه

| ارجاع مدل                                  | نام                         | زمینه   | بیشینه خروجی | یادداشت‌ها                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | پیش‌فرض                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144   | 8,192      | fallback ویژه                 |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | fallback ویژه                 |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | fallback ویژه                 |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | fallback ویژه                 |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | منسوخ، سازگاری ارتقا |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | منسوخ، سازگاری ارتقا |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="رفتار فعال‌سازی خودکار">
    ارائه‌دهنده وقتی متغیر محیطی `NVIDIA_API_KEY` تنظیم شده باشد، به‌طور خودکار فعال می‌شود.
    فراتر از کلید، هیچ پیکربندی صریحی برای ارائه‌دهنده لازم نیست.
  </Accordion>

  <Accordion title="کاتالوگ و قیمت‌گذاری">
    وقتی auth برای NVIDIA پیکربندی شده باشد، OpenClaw کاتالوگ عمومی مدل‌های ویژه
    NVIDIA را ترجیح می‌دهد و آن را برای 24 ساعت cache می‌کند. کاتالوگ fallback همراه
    ایستا است و ارجاع‌های منتشرشده منسوخ را برای سازگاری ارتقا نگه می‌دارد. هزینه‌ها
    در source به‌طور پیش‌فرض `0` هستند، چون NVIDIA در حال حاضر برای مدل‌های
    فهرست‌شده دسترسی API رایگان ارائه می‌کند.
  </Accordion>

  <Accordion title="endpoint سازگار با OpenAI">
    NVIDIA از endpoint استاندارد completions در `/v1` استفاده می‌کند. هر ابزار سازگار
    با OpenAI باید بدون پیکربندی اضافی با URL پایه NVIDIA کار کند.
  </Accordion>

  <Accordion title="پارامترهای استدلال Nemotron 3 Ultra">
    درخواست نمونه Ultra متعلق به NVIDIA از `chat_template_kwargs.enable_thinking`
    و `reasoning_budget` برای خروجی استدلال استفاده می‌کند. ردیف Ultra همراه OpenClaw
    برای استفاده معمول chat، template thinking را به‌طور پیش‌فرض غیرفعال می‌کند. اگر لازم است
    خروجی استدلال NVIDIA را فعال کنید یا فیلدهای درخواست اختصاصی دیگر NVIDIA را
    اجبار کنید، پارامترهای هر مدل را تنظیم کنید و overrideهای مختص ارائه‌دهنده را
    محدود به مدل NVIDIA نگه دارید:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "nvidia/nvidia/nemotron-3-ultra-550b-a55b": {
              params: {
                chat_template_kwargs: { enable_thinking: true },
                extra_body: { reasoning_budget: 16384 },
              },
            },
          },
        },
      },
    }
    ```

    `params.extra_body` override نهایی بدنه درخواست سازگار با OpenAI است، بنابراین
    آن را فقط برای فیلدهایی استفاده کنید که NVIDIA برای endpoint انتخاب‌شده مستند کرده است.

  </Accordion>

  <Accordion title="پاسخ‌های کند ارائه‌دهنده سفارشی">
    برخی مدل‌های سفارشی میزبانی‌شده در NVIDIA ممکن است پیش از انتشار اولین قطعه پاسخ،
    بیشتر از watchdog بیکاری مدل پیش‌فرض زمان ببرند. برای ورودی‌های ارائه‌دهنده سفارشی NVIDIA،
    به‌جای افزایش timeout کل runtime عامل، timeout ارائه‌دهنده را افزایش دهید:

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
مدل‌های NVIDIA در حال حاضر رایگان هستند. برای آخرین جزئیات دسترس‌پذیری و
محدودیت نرخ، [build.nvidia.com](https://build.nvidia.com/) را بررسی کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها، و ارائه‌دهندگان.
  </Card>
</CardGroup>
