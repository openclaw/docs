---
read_when:
    - می‌خواهید از Hugging Face Inference با OpenClaw استفاده کنید
    - به متغیر محیطی توکن HF یا گزینهٔ احراز هویت CLI نیاز دارید
summary: راه‌اندازی Hugging Face Inference (احراز هویت + انتخاب مدل)
title: Hugging Face (استنتاج)
x-i18n:
    generated_at: "2026-07-12T10:44:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c4e0d98c844c053484559254a0bdf4258c3d39954ac5804cdb0d081a651b89df
    source_path: providers/huggingface.md
    workflow: 16
---

[ارائه‌دهندگان استنتاج Hugging Face](https://huggingface.co/docs/inference-providers) یک مسیریاب تکمیل گفت‌وگوی سازگار با OpenAI را برای مدل‌های میزبانی‌شدهٔ متعدد (DeepSeek، Llama و مدل‌های دیگر) با یک توکن ارائه می‌کند. OpenClaw فقط با **نقطهٔ پایانی تکمیل گفت‌وگو** ارتباط برقرار می‌کند؛ برای تبدیل متن به تصویر، تعبیه‌سازی یا گفتار، مستقیماً از [کلاینت‌های استنتاج HF](https://huggingface.co/docs/api-inference/quicktour) استفاده کنید.

| ویژگی             | مقدار                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده | `huggingface`                                                                                                                   |
| Plugin            | همراه محصول (به‌طور پیش‌فرض فعال است و نیازی به نصب ندارد)                                                                     |
| متغیر محیطی احراز هویت | `HUGGINGFACE_HUB_TOKEN` یا `HF_TOKEN` (توکن با دسترسی ریزدانه)                                                              |
| API               | سازگار با OpenAI (`https://router.huggingface.co/v1`)                                                                           |
| صورت‌حساب          | یک توکن HF؛ [قیمت‌گذاری](https://huggingface.co/docs/inference-providers/pricing) بر اساس تعرفه‌های ارائه‌دهنده و همراه با سطح رایگان است |

## شروع به کار

<Steps>
  <Step title="Create a fine-grained token">
    به [توکن‌های تنظیمات Hugging Face](https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained) بروید و یک توکن ریزدانهٔ جدید ایجاد کنید.

    <Warning>
    مجوز **Make calls to Inference Providers** باید برای توکن فعال باشد؛ در غیر این صورت درخواست‌های API رد می‌شوند.
    </Warning>

  </Step>
  <Step title="Run onboarding">
    در فهرست کشویی ارائه‌دهنده، **Hugging Face** را انتخاب کنید و سپس هنگام درخواست، کلید API خود را وارد کنید:

    ```bash
    openclaw onboard --auth-choice huggingface-api-key
    ```

  </Step>
  <Step title="Select a default model">
    در فهرست کشویی **مدل پیش‌فرض Hugging Face**، یک مدل انتخاب کنید. اگر توکن شما معتبر باشد، فهرست از API استنتاج بارگیری می‌شود؛ در غیر این صورت OpenClaw کاتالوگ داخلی زیر را نمایش می‌دهد. انتخاب شما در `agents.defaults.model.primary` ذخیره می‌شود:

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
  <Step title="Verify the model is available">
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

مدل `huggingface/deepseek-ai/DeepSeek-R1` را به‌عنوان مدل پیش‌فرض تنظیم می‌کند.

## شناسه‌های مدل

ارجاع‌های مدل از قالب `huggingface/<org>/<model>` استفاده می‌کنند (شناسه‌هایی به سبک Hub). کاتالوگ داخلی OpenClaw:

| مدل                          | ارجاع (با پیشوند `huggingface/`)            |
| ---------------------------- | ------------------------------------------- |
| DeepSeek R1                  | `deepseek-ai/DeepSeek-R1`                   |
| DeepSeek V3.1                | `deepseek-ai/DeepSeek-V3.1`                 |
| GPT-OSS 120B                 | `openai/gpt-oss-120b`                       |
| Llama 3.3 70B Instruct Turbo | `meta-llama/Llama-3.3-70B-Instruct-Turbo`   |

<Tip>
وقتی توکن شما معتبر باشد، OpenClaw هنگام ورود اولیه و راه‌اندازی Gateway، هر مدل دیگری را نیز از **GET** `https://router.huggingface.co/v1/models` شناسایی می‌کند؛ بنابراین کاتالوگ شما می‌تواند بسیار بیشتر از چهار مدل بالا را در بر بگیرد. می‌توانید `:fastest` یا `:cheapest` را به هر شناسهٔ مدل اضافه کنید؛ مسیریاب HF درخواست را به ارائه‌دهندهٔ استنتاج منطبق هدایت می‌کند. ترتیب پیش‌فرض ارائه‌دهندگان خود را در [تنظیمات ارائه‌دهندهٔ استنتاج](https://hf.co/settings/inference-providers) تعیین کنید.
</Tip>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="Model discovery and onboarding dropdown">
    OpenClaw مدل‌ها را با درخواست زیر شناسایی می‌کند:

    ```bash
    GET https://router.huggingface.co/v1/models
    Authorization: Bearer $HUGGINGFACE_HUB_TOKEN   # or $HF_TOKEN
    ```

    پاسخ به سبک OpenAI است: `{ "object": "list", "data": [ { "id": "Qwen/Qwen3-8B", "owned_by": "Qwen", ... }, ... ] }`.

    اگر کلیدی پیکربندی شده باشد (از طریق ورود اولیه، `HUGGINGFACE_HUB_TOKEN` یا `HF_TOKEN`)، فهرست کشویی **مدل پیش‌فرض Hugging Face** هنگام راه‌اندازی تعاملی از این نقطهٔ پایانی پر می‌شود. هنگام راه‌اندازی Gateway، همین درخواست برای تازه‌سازی کاتالوگ تکرار می‌شود. مدل‌های شناسایی‌شده با کاتالوگ داخلی بالا ادغام می‌شوند؛ این کاتالوگ برای فراداده‌هایی مانند پنجرهٔ زمینه و هزینه، در صورت تطابق شناسه، استفاده می‌شود. اگر درخواست ناموفق باشد، داده‌ای برنگرداند یا هیچ کلیدی تنظیم نشده باشد، OpenClaw فقط به کاتالوگ داخلی بازمی‌گردد.

    برای غیرفعال‌کردن شناسایی بدون حذف ارائه‌دهنده:

    ```bash
    openclaw config set plugins.entries.huggingface.config.discovery.enabled false
    ```

  </Accordion>

  <Accordion title="Model names, aliases, and policy suffixes">
    - **نام دریافتی از API:** مدل‌های شناسایی‌شده در صورت وجود از `name`، `title` یا `display_name` در API استفاده می‌کنند؛ در غیر این صورت OpenClaw نامی را از شناسهٔ مدل استخراج می‌کند (برای مثال، `deepseek-ai/DeepSeek-R1` به «DeepSeek R1» تبدیل می‌شود).
    - **بازنویسی نام نمایشی:** برای هر مدل، یک برچسب سفارشی در پیکربندی تنظیم کنید:

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

    - **پسوندهای سیاست:** `:fastest` و `:cheapest` قراردادهای مسیریاب HF هستند و OpenClaw آن‌ها را بازنویسی نمی‌کند: پسوند عیناً به‌عنوان بخشی از شناسهٔ مدل ارسال می‌شود و مسیریاب HF ارائه‌دهندهٔ استنتاج منطبق را انتخاب می‌کند. اگر برای هر پسوند نام مستعار جداگانه‌ای می‌خواهید، هر گونه را به‌صورت یک ورودی مستقل زیر `models.providers.huggingface.models` (یا در `model.primary`) اضافه کنید.
    - **ادغام پیکربندی:** ورودی‌های موجود در `models.providers.huggingface.models` (برای مثال در `models.json`) هنگام ادغام پیکربندی حفظ می‌شوند؛ بنابراین هر `name`، `alias` یا گزینهٔ مدلی که آنجا تنظیم کنید، پس از راه‌اندازی مجدد نیز باقی می‌ماند.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    اگر Gateway به‌صورت دیمن (launchd/systemd) اجرا می‌شود، مطمئن شوید `HUGGINGFACE_HUB_TOKEN` یا `HF_TOKEN` برای آن فرایند در دسترس است (برای مثال در `~/.openclaw/.env` یا از طریق `env.shellEnv`).

    <Note>
    OpenClaw هر دو متغیر `HUGGINGFACE_HUB_TOKEN` و `HF_TOKEN` را می‌پذیرد. اگر هر دو تنظیم شده باشند، `HUGGINGFACE_HUB_TOKEN` اولویت دارد.
    </Note>

  </Accordion>

  <Accordion title="Config: DeepSeek R1 with fallback">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-R1",
            fallbacks: ["huggingface/openai/gpt-oss-120b"],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek with cheapest and fastest variants">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "huggingface/deepseek-ai/DeepSeek-R1" },
          models: {
            "huggingface/deepseek-ai/DeepSeek-R1": { alias: "DeepSeek R1" },
            "huggingface/deepseek-ai/DeepSeek-R1:cheapest": { alias: "DeepSeek R1 (cheapest)" },
            "huggingface/deepseek-ai/DeepSeek-R1:fastest": { alias: "DeepSeek R1 (fastest)" },
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="Config: DeepSeek + Llama + GPT-OSS with aliases">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "huggingface/deepseek-ai/DeepSeek-V3.1",
            fallbacks: [
              "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo",
              "huggingface/openai/gpt-oss-120b",
            ],
          },
          models: {
            "huggingface/deepseek-ai/DeepSeek-V3.1": { alias: "DeepSeek V3.1" },
            "huggingface/meta-llama/Llama-3.3-70B-Instruct-Turbo": { alias: "Llama 3.3 70B Turbo" },
            "huggingface/openai/gpt-oss-120b": { alias: "GPT-OSS 120B" },
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Model selection" href="/fa/concepts/model-providers" icon="layers">
    نمایی کلی از همهٔ ارائه‌دهندگان، ارجاع‌های مدل و رفتار جابه‌جایی هنگام خرابی.
  </Card>
  <Card title="Model selection" href="/fa/concepts/models" icon="brain">
    نحوهٔ انتخاب و پیکربندی مدل‌ها.
  </Card>
  <Card title="Inference Providers docs" href="https://huggingface.co/docs/inference-providers" icon="book">
    مستندات رسمی ارائه‌دهندگان استنتاج Hugging Face.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی.
  </Card>
</CardGroup>
