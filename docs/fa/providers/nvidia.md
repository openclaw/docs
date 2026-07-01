---
read_when:
    - می‌خواهید از مدل‌های متن‌باز در OpenClaw به‌صورت رایگان استفاده کنید
    - باید NVIDIA_API_KEY را تنظیم کنید
    - می‌خواهید از Nemotron 3 Ultra از طریق NVIDIA استفاده کنید
summary: از API سازگار با OpenAI شرکت NVIDIA در OpenClaw استفاده کنید
title: NVIDIA
x-i18n:
    generated_at: "2026-07-01T20:30:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b738746acead8dcaa74a39b13b4413171c5bf60efa5166dbc9b259d883a4e22
    source_path: providers/nvidia.md
    workflow: 16
---

NVIDIA یک API سازگار با OpenAI در `https://integrate.api.nvidia.com/v1` برای
مدل‌های باز به‌صورت رایگان ارائه می‌کند. با یک کلید API از
[build.nvidia.com](https://build.nvidia.com/settings/api-keys) احراز هویت کنید. OpenClaw
ارائه‌دهنده NVIDIA را به‌طور پیش‌فرض روی Nemotron 3 Ultra قرار می‌دهد؛ مدل استدلال فعال
NVIDIA با مجموع 550B / فعال 55B برای کارهای عامل‌محور با زمینه طولانی.

## شروع به کار

<Steps>
  <Step title="Get your API key">
    در [build.nvidia.com](https://build.nvidia.com/settings/api-keys) یک کلید API بسازید.
  </Step>
  <Step title="Export the key and run onboarding">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice nvidia-api-key
    ```
  </Step>
  <Step title="Set an NVIDIA model">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-ultra-550b-a55b
    ```
  </Step>
</Steps>

<Warning>
اگر به‌جای متغیر محیطی، `--nvidia-api-key` را ارسال کنید، مقدار آن در تاریخچه shell
و خروجی `ps` ثبت می‌شود. در صورت امکان، متغیر محیطی `NVIDIA_API_KEY` را ترجیح دهید.
</Warning>

برای راه‌اندازی غیرتعاملی، می‌توانید کلید را مستقیماً هم ارسال کنید:

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

## کاتالوگ برجسته

وقتی یک کلید API برای NVIDIA پیکربندی شده باشد، مسیرهای راه‌اندازی و انتخاب مدل
OpenClaw تلاش می‌کنند کاتالوگ عمومی مدل‌های برجسته NVIDIA را از
`https://assets.ngc.nvidia.com/products/api-catalog/featured-models.json` دریافت کنند و
نتیجه رتبه‌بندی‌شده را به‌مدت 24 ساعت cache می‌کنند. بنابراین مدل‌های برجسته جدید از build.nvidia.com
بدون انتظار برای انتشار OpenClaw در سطوح راه‌اندازی و انتخاب مدل ظاهر می‌شوند.
وقتی خوراک زنده در دسترس باشد، نخستین مدل برگشتی گزینه پیش‌فرضی است که هنگام راه‌اندازی NVIDIA نمایش داده می‌شود.

این دریافت از یک سیاست میزبان HTTPS ثابت برای `assets.ngc.nvidia.com` استفاده می‌کند. اگر هیچ
کلید API برای NVIDIA پیکربندی نشده باشد، یا اگر آن کاتالوگ عمومی در دسترس نباشد یا
ناقص باشد، OpenClaw به کاتالوگ bundled و پیش‌فرض bundled زیر برمی‌گردد.

## Nemotron 3 Ultra

Nemotron 3 Ultra مدل پیش‌فرض NVIDIA در OpenClaw است. صفحه build متعلق به NVIDIA برای
[`nvidia/nemotron-3-ultra-550b-a55b`](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)
آن را به‌عنوان یک endpoint رایگان در دسترس با مشخصات زمینه 1M-token فهرست می‌کند.
کاتالوگ bundled حداکثر خروجی 16,384-token را ثبت می‌کند تا با درخواست نمونه سازگار با OpenAI فعلی NVIDIA
برای endpoint میزبانی‌شده مطابقت داشته باشد.

برای بالاترین قابلیت در پیش‌فرض NVIDIA از Ultra استفاده کنید. وقتی گزینه کوچک‌تر Nemotron 3 را می‌خواهید،
Super را انتخاب‌شده نگه دارید، یا وقتی زمینه، تأخیر، یا رفتار یکی از مدل‌های شخص ثالث
میزبانی‌شده در کاتالوگ NVIDIA مناسب‌تر است، یکی از آن‌ها را انتخاب کنید.
ردیف Ultra در کاتالوگ bundled به‌طور پیش‌فرض `chat_template_kwargs.enable_thinking: false` و
`force_nonempty_content: true` را ارسال می‌کند تا خروجی عادی chat به‌جای افشای متن استدلال،
در پاسخ قابل مشاهده باقی بماند.

## کاتالوگ جایگزین bundled

| ارجاع مدل                                  | نام                         | زمینه   | حداکثر خروجی | یادداشت‌ها                             |
| ------------------------------------------ | ---------------------------- | --------- | ---------- | --------------------------------- |
| `nvidia/nvidia/nemotron-3-ultra-550b-a55b` | NVIDIA Nemotron 3 Ultra 550B | 1,000,000 | 16,384     | پیش‌فرض                           |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 1,048,576 | 8,192      | جایگزین برجسته                 |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144   | 8,192      | جایگزین برجسته                 |
| `nvidia/minimaxai/minimax-m2.7`            | Minimax M2.7                 | 196,608   | 8,192      | جایگزین برجسته                 |
| `nvidia/z-ai/glm-5.1`                      | GLM 5.1                      | 202,752   | 8,192      | جایگزین برجسته                 |
| `nvidia/minimaxai/minimax-m2.5`            | MiniMax M2.5                 | 196,608   | 8,192      | منسوخ، سازگاری ارتقا |
| `nvidia/z-ai/glm5`                         | GLM-5                        | 202,752   | 8,192      | منسوخ، سازگاری ارتقا |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Auto-enable behavior">
    وقتی متغیر محیطی `NVIDIA_API_KEY` تنظیم شده باشد، ارائه‌دهنده به‌طور خودکار فعال می‌شود.
    فراتر از کلید، هیچ پیکربندی صریحی برای ارائه‌دهنده لازم نیست.
  </Accordion>

  <Accordion title="Catalog and pricing">
    وقتی احراز هویت NVIDIA پیکربندی شده باشد، OpenClaw کاتالوگ عمومی مدل‌های برجسته NVIDIA را ترجیح می‌دهد
    و آن را به‌مدت 24 ساعت cache می‌کند. کاتالوگ جایگزین bundled ایستا است
    و ارجاع‌های shipped منسوخ را برای سازگاری ارتقا نگه می‌دارد. هزینه‌ها در منبع به‌طور پیش‌فرض
    `0` هستند، چون NVIDIA در حال حاضر برای مدل‌های فهرست‌شده دسترسی رایگان API ارائه می‌کند.
  </Accordion>

  <Accordion title="OpenAI-compatible endpoint">
    NVIDIA از endpoint استاندارد completions با مسیر `/v1` استفاده می‌کند. هر ابزار سازگار با OpenAI
    باید با URL پایه NVIDIA بدون تنظیمات اضافی کار کند.
  </Accordion>

  <Accordion title="Nemotron 3 Ultra reasoning params">
    درخواست نمونه Ultra متعلق به NVIDIA از `chat_template_kwargs.enable_thinking`
    و `reasoning_budget` برای خروجی استدلال استفاده می‌کند. ردیف Ultra در کاتالوگ bundled OpenClaw
    برای استفاده عادی chat، template thinking را به‌طور پیش‌فرض غیرفعال می‌کند. اگر لازم است
    خروجی استدلال NVIDIA را فعال کنید یا فیلدهای درخواست اختصاصی دیگر NVIDIA را اجبار کنید،
    params هر مدل را تنظیم کنید و overrideهای اختصاصی ارائه‌دهنده را محدود به
    مدل NVIDIA نگه دارید:

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

    `params.extra_body` override نهایی بدنه درخواست سازگار با OpenAI است، پس
    آن را فقط برای فیلدهایی استفاده کنید که NVIDIA برای endpoint انتخاب‌شده مستند کرده است.

  </Accordion>

  <Accordion title="Slow custom provider responses">
    بعضی مدل‌های سفارشی میزبانی‌شده توسط NVIDIA می‌توانند پیش از انتشار نخستین قطعه پاسخ،
    بیش از watchdog پیش‌فرض بیکاری مدل زمان ببرند. برای ورودی‌های سفارشی ارائه‌دهنده NVIDIA،
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
استفاده از مدل‌های NVIDIA در حال حاضر رایگان است. برای آخرین جزئیات دسترس‌پذیری و
محدودیت نرخ، [build.nvidia.com](https://build.nvidia.com/) را بررسی کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    انتخاب ارائه‌دهندگان، ارجاع‌های مدل، و رفتار failover.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی برای عامل‌ها، مدل‌ها، و ارائه‌دهندگان.
  </Card>
</CardGroup>
