---
read_when:
    - می‌خواهید از Hugging Face Inference با OpenClaw استفاده کنید
    - به متغیر محیطی توکن HF یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Hugging Face Inference (احراز هویت + انتخاب مدل)
title: Hugging Face (استنتاج)
x-i18n:
    generated_at: "2026-04-29T23:25:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 93b3049e8d42787acba12ec3ddf70603159251dae1d870047f8ffc9242f202a5
    source_path: providers/huggingface.md
    workflow: 16
---

[Hugging Face Inference Providers](https://huggingface.co/docs/inference-providers) تکمیل‌های گفت‌وگوی سازگار با OpenAI را از طریق یک API مسیریاب واحد ارائه می‌کند. با یک توکن به مدل‌های زیادی (DeepSeek، Llama و موارد بیشتر) دسترسی می‌گیرید. OpenClaw از **نقطه پایانی سازگار با OpenAI** استفاده می‌کند (فقط تکمیل‌های گفت‌وگو)؛ برای تبدیل متن به تصویر، embeddings یا گفتار، مستقیماً از [کلاینت‌های استنتاج HF](https://huggingface.co/docs/api-inference/quicktour) استفاده کنید.

- ارائه‌دهنده: `huggingface`
- احراز هویت: `HUGGINGFACE_HUB_TOKEN` یا `HF_TOKEN` (توکن دقیق با **Make calls to Inference Providers**)
- API: سازگار با OpenAI (`https://router.huggingface.co/v1`)
- صورت‌حساب: یک توکن HF؛ [قیمت‌گذاری](https://huggingface.co/docs/inference-providers/pricing) نرخ‌های ارائه‌دهنده را همراه با یک سطح رایگان دنبال می‌کند.

## شروع به کار

<Steps>
  <Step title="ایجاد یک توکن دقیق">
    به [توکن‌های تنظیمات Hugging Face](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) بروید و یک توکن دقیق جدید بسازید.

    <Warning>
    توکن باید مجوز **Make calls to Inference Providers** را فعال داشته باشد، وگرنه درخواست‌های API رد می‌شوند.
    </Warning>

  </Step>
  <Step title="اجرای راه‌اندازی اولیه">
    در فهرست کشویی ارائه‌دهنده، **Hugging Face** را انتخاب کنید، سپس هنگام درخواست، کلید API خود را وارد کنید:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="انتخاب یک مدل پیش‌فرض">
    در فهرست کشویی **مدل پیش‌فرض Hugging Face**، مدل مورد نظر خود را انتخاب کنید. وقتی توکن معتبر دارید، فهرست از Inference API بارگذاری می‌شود؛ در غیر این صورت یک فهرست داخلی نمایش داده می‌شود. انتخاب شما به‌عنوان مدل پیش‌فرض ذخیره می‌شود.

    همچنین می‌توانید بعداً مدل پیش‌فرض را در پیکربندی تنظیم یا تغییر دهید:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
        },
      },
    }
    ```

  </Step>
  <Step title="بررسی در دسترس بودن مدل">
    ```bash
    openclaw models list --provider huggingface
    ```
  </Step>
</Steps>

### راه‌اندازی غیرتعاملی

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice huggingface-api-key \
  --huggingface-api-key "$HF_TOKEN"
```

این کار `huggingface/deepseek-ai/DeepSeek-R1` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.

## شناسه‌های مدل

ارجاع‌های مدل از قالب `huggingface/<org>/<model>` استفاده می‌کنند (شناسه‌های سبک Hub). فهرست زیر از **GET** `https://router.huggingface.co/v1/models` گرفته شده است؛ کاتالوگ شما ممکن است موارد بیشتری داشته باشد.

| مدل | ارجاع (با پیشوند `huggingface/`) |
| ---------------------- | ----------------------------------- |
| DeepSeek R1            | `deepseek-ai/DeepSeek-R1`           |
| DeepSeek V3.2          | `deepseek-ai/DeepSeek-V3.2`         |
| Qwen3 8B               | `Qwen/Qwen3-8B`                     |
| Qwen2.5 7B Instruct    | `Qwen/Qwen2.5-7B-Instruct`          |
| Qwen3 32B              | `Qwen/Qwen3-32B`                    |
| Llama 3.3 70B Instruct | `meta-llama/Llama-3.3-70B-Instruct` |
| Llama 3.1 8B Instruct  | `meta-llama/Llama-3.1-8B-Instruct`  |
| GPT-OSS 120B           | `openai/gpt-oss-120b`               |
| GLM 4.7                | `zai-org/GLM-4.7`                   |
| Kimi K2.5              | `moonshotai/Kimi-K2.5`              |

<Tip>
می‌توانید `:fastest` یا `:cheapest` را به هر شناسه مدل اضافه کنید. ترتیب پیش‌فرض خود را در [تنظیمات Inference Provider](https://hf.co/settings/inference-providers) تنظیم کنید؛ برای فهرست کامل، [Inference Providers](https://huggingface.co/docs/inference-providers) و **GET** `https://router.huggingface.co/v1/models` را ببینید.
</Tip>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="کشف مدل و فهرست کشویی راه‌اندازی اولیه">
    OpenClaw مدل‌ها را با فراخوانی مستقیم **نقطه پایانی Inference** کشف می‌کند:

    ```bash
    GET https://router.huggingface.co/v1/models
    ```

    (اختیاری: برای دریافت فهرست کامل، `Authorization: Bearer $HUGGINGFACE_HUB_TOKEN` یا `$HF_TOKEN` را ارسال کنید؛ برخی نقاط پایانی بدون احراز هویت زیرمجموعه‌ای را برمی‌گردانند.) پاسخ به سبک OpenAI است: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    وقتی یک کلید API مربوط به Hugging Face را پیکربندی می‌کنید (از طریق راه‌اندازی اولیه، `HUGGINGFACE_HUB_TOKEN` یا `HF_TOKEN`)، OpenClaw از این GET برای کشف مدل‌های تکمیل گفت‌وگوی موجود استفاده می‌کند. هنگام **راه‌اندازی تعاملی**، پس از وارد کردن توکن، یک فهرست کشویی **مدل پیش‌فرض Hugging Face** می‌بینید که از آن فهرست پر شده است (یا اگر درخواست ناموفق باشد، از کاتالوگ داخلی). در زمان اجرا (برای نمونه، هنگام شروع Gateway)، وقتی کلید موجود باشد، OpenClaw دوباره **GET** `https://router.huggingface.co/v1/models` را برای تازه‌سازی کاتالوگ فراخوانی می‌کند. این فهرست با یک کاتالوگ داخلی ادغام می‌شود (برای فراداده‌هایی مانند پنجره زمینه و هزینه). اگر درخواست ناموفق باشد یا هیچ کلیدی تنظیم نشده باشد، فقط از کاتالوگ داخلی استفاده می‌شود.

  </Accordion>

  <Accordion title="نام‌های مدل، نام‌های مستعار و پسوندهای سیاست">
    - **نام از API:** وقتی API یکی از `name`، `title` یا `display_name` را برمی‌گرداند، نام نمایشی مدل از **GET /v1/models** تکمیل می‌شود؛ در غیر این صورت از شناسه مدل ساخته می‌شود (برای نمونه `deepseek-ai/DeepSeek-R1` به "DeepSeek R1" تبدیل می‌شود).
    - **بازنویسی نام نمایشی:** می‌توانید برای هر مدل در پیکربندی یک برچسب سفارشی تنظیم کنید تا در CLI و UI همان‌طور که می‌خواهید نمایش داده شود:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1 (fast)" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheap)" },
          },
        },
      },
    }
    ```

    - **پسوندهای سیاست:** مستندات و راهنماهای داخلی Hugging Face در OpenClaw در حال حاضر این دو پسوند را به‌عنوان گونه‌های سیاست داخلی در نظر می‌گیرند:
      - **`:fastest`** — بالاترین توان عملیاتی.
      - **`:cheapest`** — کمترین هزینه به ازای هر توکن خروجی.

      می‌توانید این موارد را به‌عنوان ورودی‌های جداگانه در `models.providers.huggingface.models` اضافه کنید یا `model.primary` را همراه با پسوند تنظیم کنید. همچنین می‌توانید ترتیب ارائه‌دهنده پیش‌فرض خود را در [تنظیمات Inference Provider](https://hf.co/settings/inference-providers) تنظیم کنید (بدون پسوند = استفاده از همان ترتیب).

    - **ادغام پیکربندی:** ورودی‌های موجود در `models.providers.huggingface.models` (برای نمونه در `models.json`) هنگام ادغام پیکربندی حفظ می‌شوند. بنابراین هر `name`، `alias` یا گزینه مدل سفارشی که آنجا تنظیم کرده باشید حفظ می‌شود.

  </Accordion>

  <Accordion title="محیط و راه‌اندازی daemon">
    اگر Gateway به‌صورت daemon اجرا می‌شود (launchd/systemd)، مطمئن شوید `HUGGINGFACE_HUB_TOKEN` یا `HF_TOKEN` برای آن فرایند در دسترس است (برای نمونه در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Note>
    OpenClaw هر دو `HUGGINGFACE_HUB_TOKEN` و `HF_TOKEN` را به‌عنوان نام‌های مستعار متغیر محیطی می‌پذیرد. هرکدام کار می‌کند؛ اگر هر دو تنظیم شده باشند، `HUGGINGFACE_HUB_TOKEN` اولویت دارد.
    </Note>

  </Accordion>

  <Accordion title="پیکربندی: DeepSeek R1 با جایگزین Qwen">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/Qwen/Qwen3-8B"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="پیکربندی: Qwen با گونه‌های ارزان‌ترین و سریع‌ترین">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen3-8B" },
          models: {
            "huggingface/Qwen/Qwen3-8B": { alias: "Qwen3 8B" },
            "huggingface/Qwen/Qwen3-8B:cheapest": { alias: "Qwen3 8B (cheapest)" },
            "huggingface/Qwen/Qwen3-8B:fastest": { alias: "Qwen3 8B (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="پیکربندی: DeepSeek + Llama + GPT-OSS با نام‌های مستعار">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.2",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.2": { alias: "DeepSeek V3.2" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct": { alias: "Llama 3.3 70B" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="پیکربندی: چند Qwen و DeepSeek با پسوندهای سیاست">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest" },
          models: {
            "huggingface/Qwen/Qwen2.5-7B-Instruct": { alias: "Qwen2.5 7B" },
            "huggingface/Qwen/Qwen2.5-7B-Instruct:cheapest": { alias: "Qwen2.5 7B (cheap)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fast)" },
            "huggingface/meta-llama/Llama-3.1-8B-Instruct": { alias: "Llama 3.1 8B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="انتخاب مدل" href="/fa/concepts/model-providers" icon="layers">
    نمای کلی همه ارائه‌دهندگان، ارجاع‌های مدل و رفتار failover.
  </Card>
  <Card title="انتخاب مدل" href="/fa/concepts/models" icon="brain">
    نحوه انتخاب و پیکربندی مدل‌ها.
  </Card>
  <Card title="مستندات Inference Providers" href="https://huggingface.co/docs/inference-providers" icon="book">
    مستندات رسمی Hugging Face Inference Providers.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی.
  </Card>
</CardGroup>
