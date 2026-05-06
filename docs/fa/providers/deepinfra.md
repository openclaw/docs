---
read_when:
    - شما یک کلید API واحد برای برترین LLMهای متن‌باز می‌خواهید
    - می‌خواهید مدل‌ها را از طریق API DeepInfra در OpenClaw اجرا کنید
summary: از API یکپارچه DeepInfra برای دسترسی به محبوب‌ترین مدل‌های متن‌باز و پیشرو در OpenClaw استفاده کنید
title: DeepInfra
x-i18n:
    generated_at: "2026-05-06T09:37:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5e68c3f764ac91548c2ced0b650e582f6d315ad7f154d19a00f299a3737494cd
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra یک **API یکپارچه** ارائه می‌دهد که درخواست‌ها را پشت یک نقطه پایانی و کلید API واحد، به محبوب‌ترین مدل‌های متن‌باز و پیشرو هدایت می‌کند. با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر نشانی پایه کار می‌کنند.

## دریافت کلید API

1. به [https://deepinfra.com/](https://deepinfra.com/) بروید
2. وارد شوید یا یک حساب بسازید
3. به Dashboard / Keys بروید و یک کلید API جدید بسازید یا از کلید خودکار ساخته‌شده استفاده کنید

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
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## سطوح پشتیبانی‌شده OpenClaw

Plugin همراه، همه سطوح DeepInfra را که با قراردادهای فعلی ارائه‌دهنده OpenClaw مطابقت دارند ثبت می‌کند:

| سطح                      | مدل پیش‌فرض                         | پیکربندی/ابزار OpenClaw                                  |
| ------------------------ | ---------------------------------- | -------------------------------------------------------- |
| ارائه‌دهنده چت / مدل     | `deepseek-ai/DeepSeek-V3.2`        | `agents.defaults.model`                                  |
| تولید/ویرایش تصویر      | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| درک رسانه                | `moonshotai/Kimi-K2.5` برای تصاویر | درک تصویر ورودی                                          |
| گفتار به متن             | `openai/whisper-large-v3-turbo`    | رونویسی صوت ورودی                                        |
| متن به گفتار             | `hexgrad/Kokoro-82M`               | `messages.tts.provider: "deepinfra"`                     |
| تولید ویدیو              | `Pixverse/Pixverse-T2V`            | `video_generate`, `agents.defaults.videoGenerationModel` |
| embeddingهای حافظه       | `BAAI/bge-m3`                      | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra همچنین بازرتبه‌بندی، دسته‌بندی، تشخیص شیء و انواع مدل بومی دیگر را نیز ارائه می‌کند. OpenClaw در حال حاضر برای این دسته‌ها قراردادهای ارائه‌دهنده سطح اول ندارد، بنابراین این Plugin هنوز آن‌ها را ثبت نمی‌کند.

## مدل‌های موجود

OpenClaw هنگام راه‌اندازی، مدل‌های موجود DeepInfra را به‌صورت پویا کشف می‌کند. برای دیدن فهرست کامل مدل‌های موجود، از `/models deepinfra` استفاده کنید.

هر مدلی که در [DeepInfra.com](https://deepinfra.com/) موجود باشد می‌تواند با پیشوند `deepinfra/` استفاده شود:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## نکته‌ها

- ارجاع‌های مدل به شکل `deepinfra/<provider>/<model>` هستند (برای مثال، `deepinfra/Qwen/Qwen3-Max`).
- مدل پیش‌فرض: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- نشانی پایه: `https://api.deepinfra.com/v1/openai`
- تولید ویدیوی بومی از `https://api.deepinfra.com/v1/inference/<model>` استفاده می‌کند.

## مرتبط

- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [همه ارائه‌دهندگان](/fa/providers/index)
