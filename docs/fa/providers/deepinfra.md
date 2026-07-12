---
read_when:
    - شما یک کلید API واحد برای برترین مدل‌های زبانی بزرگ متن‌باز می‌خواهید
    - می‌خواهید مدل‌ها را از طریق API دیپ‌اینفرا در OpenClaw اجرا کنید
summary: برای دسترسی به محبوب‌ترین مدل‌های متن‌باز و پیشرو در OpenClaw، از API یکپارچهٔ DeepInfra استفاده کنید
title: DeepInfra
x-i18n:
    generated_at: "2026-07-12T10:43:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7f68bac84311d20348007c715803a34451ba8ab0c09beba63366ba5b1b29de05
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra درخواست‌ها را به مدل‌های متن‌باز محبوب و مدل‌های پیشرو، از طریق یک نقطه پایانی سازگار با OpenAI و یک کلید API واحد، هدایت می‌کند. بیشتر SDKهای OpenAI با تغییر نشانی پایه با آن کار می‌کنند.

## نصب Plugin

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## دریافت کلید API

1. در [deepinfra.com](https://deepinfra.com/) وارد شوید
2. به Dashboard / Keys بروید و یک کلید ایجاد کنید، یا از کلیدی که به‌طور خودکار ایجاد شده است استفاده کنید

## راه‌اندازی CLI

```bash
openclaw onboard --deepinfra-api-key <key>
```

یا متغیر محیطی را تنظیم کنید:

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## قطعه پیکربندی

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V4-Flash" },
    },
  },
}
```

## قابلیت‌های پشتیبانی‌شده

گفت‌وگو، تولید تصویر و تولید ویدئو، پس از پیکربندی `DEEPINFRA_API_KEY`، فهرست مدل‌های خود را به‌صورت زنده از `https://api.deepinfra.com/v1/openai/models?sort_by=openclaw&filter=with_meta` به‌روزرسانی می‌کنند. سایر قابلیت‌ها تا زمانی که به همین فهرست زنده منتقل شوند، از مقادیر پیش‌فرض ثابت زیر استفاده می‌کنند.

| قابلیت | مدل پیش‌فرض | پیکربندی/ابزار OpenClaw |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| گفت‌وگو / ارائه‌دهنده مدل | نخستین ورودی دارای برچسب گفت‌وگو در فهرست زنده (جایگزین ثابت `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model` |
| تولید/ویرایش تصویر | نخستین ورودی دارای برچسب `image-gen` در فهرست زنده (جایگزین ثابت `black-forest-labs/FLUX-1-schnell`) | `image_generate`، `agents.defaults.imageGenerationModel` |
| درک رسانه | `moonshotai/Kimi-K2.5` برای تصاویر | درک تصاویر ورودی |
| تبدیل گفتار به متن | `openai/whisper-large-v3-turbo` | رونویسی صوت ورودی |
| تبدیل متن به گفتار | `hexgrad/Kokoro-82M` | `messages.tts.provider: "deepinfra"` |
| تولید ویدئو | جایگزین ثابت `Pixverse/Pixverse-T2V` (در حال حاضر هیچ ردیف زنده‌ای با برچسب `video-gen` از DeepInfra وجود ندارد) | `video_generate`، `agents.defaults.videoGenerationModel` |
| تعبیه‌های حافظه | `BAAI/bge-m3` | `agents.defaults.memorySearch.provider: "deepinfra"` |

DeepInfra همچنین بازرتبه‌بندی، طبقه‌بندی، تشخیص اشیا و انواع بومی دیگر مدل‌ها را ارائه می‌کند. OpenClaw هنوز برای این دسته‌ها قرارداد ارائه‌دهنده‌ای ندارد، بنابراین این Plugin آن‌ها را ثبت نمی‌کند.

## مدل‌های موجود

OpenClaw پس از پیکربندی یک کلید، مدل‌های DeepInfra را به‌صورت پویا شناسایی می‌کند. برای مشاهده فهرست فعلی، از `/models deepinfra` یا `openclaw models list --provider deepinfra` استفاده کنید.

هر مدلی در [deepinfra.com](https://deepinfra.com/) با پیشوند `deepinfra/` کار می‌کند:

```text
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...و مدل‌های بسیار دیگر
```

## نکات

- ارجاع‌های مدل به‌شکل `deepinfra/<provider>/<model>` هستند (برای مثال `deepinfra/Qwen/Qwen3-Max`).
- مدل پیش‌فرض گفت‌وگو: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- نشانی پایه: `https://api.deepinfra.com/v1/openai`
- تولید بومی ویدئو از `https://api.deepinfra.com/v1/inference/<model>` استفاده می‌کند.

## مرتبط

- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [همه ارائه‌دهندگان](/fa/providers/index)
