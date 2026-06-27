---
read_when:
    - یک کلید API واحد برای برترین LLMهای متن‌باز می‌خواهید
    - می‌خواهید مدل‌ها را از طریق API شرکت DeepInfra در OpenClaw اجرا کنید
summary: از API یکپارچه DeepInfra برای دسترسی به محبوب‌ترین مدل‌های متن‌باز و پیشرو در OpenClaw استفاده کنید.
title: DeepInfra
x-i18n:
    generated_at: "2026-06-27T18:38:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 059a556c24d2de2c8c5290b54c78fbc7451dc534238bfc4c725dcfbbd9a2d17f
    source_path: providers/deepinfra.md
    workflow: 16
---

DeepInfra یک **API یکپارچه** ارائه می‌کند که درخواست‌ها را به محبوب‌ترین مدل‌های متن‌باز و frontier پشت یک endpoint و کلید API واحد هدایت می‌کند. این API با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر URL پایه کار می‌کنند.

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را بازراه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/deepinfra-provider
openclaw gateway restart
```

## دریافت کلید API

1. به [https://deepinfra.com/](https://deepinfra.com/) بروید
2. وارد شوید یا یک حساب بسازید
3. به Dashboard / Keys بروید و یک کلید API جدید ایجاد کنید یا از کلیدی که به‌صورت خودکار ساخته شده استفاده کنید

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

## سطح‌های پشتیبانی‌شده OpenClaw

این Plugin همه سطح‌های DeepInfra را که با قراردادهای فعلی ارائه‌دهنده OpenClaw مطابقت دارند ثبت می‌کند. چت، تولید تصویر و تولید ویدیو
وقتی `DEEPINFRA_API_KEY` پیکربندی شده باشد، کاتالوگ‌های مدل خود را به‌صورت زنده از `/v1/openai/models?sort_by=openclaw&filter=with_meta`
بازآوری می‌کنند؛ سطح‌های دیگر از پیش‌فرض‌های ثابت گزینش‌شده زیر استفاده می‌کنند.

| سطح | مدل پیش‌فرض | پیکربندی/ابزار OpenClaw |
| ------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| چت / ارائه‌دهنده مدل | نخستین ورودی دارای برچسب چت از کاتالوگ زنده (fallback مانیفست `deepseek-ai/DeepSeek-V4-Flash`) | `agents.defaults.model` |
| تولید/ویرایش تصویر | نخستین ورودی دارای برچسب `image-gen` از کاتالوگ زنده (fallback ثابت `black-forest-labs/FLUX-1-schnell`) | `image_generate`, `agents.defaults.imageGenerationModel` |
| درک رسانه | `moonshotai/Kimi-K2.5` برای تصاویر | درک تصویر ورودی |
| گفتار به متن | `openai/whisper-large-v3-turbo` | رونویسی صوت ورودی |
| متن به گفتار | `hexgrad/Kokoro-82M` | `messages.tts.provider: "deepinfra"` |
| تولید ویدیو | نخستین ورودی دارای برچسب `video-gen` از کاتالوگ زنده (fallback ثابت `Pixverse/Pixverse-T2V`) | `video_generate`, `agents.defaults.videoGenerationModel` |
| تعبیه‌های حافظه | `BAAI/bge-m3` | `agents.defaults.memorySearch.provider: "deepinfra"` |

DeepInfra همچنین reranking، classification، object-detection و انواع مدل بومی دیگر را ارائه می‌دهد. OpenClaw در حال حاضر برای این دسته‌ها قراردادهای ارائه‌دهنده سطح‌اول ندارد، بنابراین این Plugin هنوز آن‌ها را ثبت نمی‌کند.

## مدل‌های موجود

OpenClaw هنگام راه‌اندازی، مدل‌های DeepInfra موجود را به‌صورت پویا کشف می‌کند. برای دیدن فهرست کامل مدل‌های موجود از
`/models deepinfra` استفاده کنید.

هر مدلی که در [DeepInfra.com](https://deepinfra.com/) موجود باشد می‌تواند با پیشوند `deepinfra/` استفاده شود:

```
deepinfra/deepseek-ai/DeepSeek-V4-Flash
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/moonshotai/Kimi-K2.5
deepinfra/nvidia/NVIDIA-Nemotron-3-Super-120B-A12B
deepinfra/zai-org/GLM-5.1
...and many more
```

## نکات

- ارجاع‌های مدل به شکل `deepinfra/<provider>/<model>` هستند (مثلاً `deepinfra/Qwen/Qwen3-Max`).
- مدل پیش‌فرض: `deepinfra/deepseek-ai/DeepSeek-V4-Flash`
- URL پایه: `https://api.deepinfra.com/v1/openai`
- تولید ویدیوی بومی از `https://api.deepinfra.com/v1/inference/<model>` استفاده می‌کند.

## مرتبط

- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [همه ارائه‌دهندگان](/fa/providers/index)
