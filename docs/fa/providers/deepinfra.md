---
read_when:
    - شما برای برترین مدل‌های زبانی بزرگ متن‌باز یک کلید API واحد می‌خواهید
    - می‌خواهید مدل‌ها را از طریق API DeepInfra در OpenClaw اجرا کنید
summary: از API یکپارچه DeepInfra برای دسترسی به محبوب‌ترین مدل‌های متن‌باز و پیشرو در OpenClaw استفاده کنید
x-i18n:
    generated_at: "2026-04-29T23:24:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22a178e7ac582e094f82f5779a9a963e0bf77b1b19820f74725255b6be0b0593
    source_path: providers/deepinfra.md
    workflow: 16
---

# DeepInfra

DeepInfra یک **API یکپارچه** ارائه می‌کند که درخواست‌ها را به محبوب‌ترین مدل‌های متن‌باز و frontier پشت یک endpoint و کلید API واحد مسیریابی می‌کند. با OpenAI سازگار است، بنابراین بیشتر SDKهای OpenAI با تغییر base URL کار می‌کنند.

## دریافت کلید API

1. به [https://deepinfra.com/](https://deepinfra.com/) بروید
2. وارد شوید یا یک حساب کاربری بسازید
3. به Dashboard / Keys بروید و یک کلید API جدید بسازید یا از کلیدی که به‌صورت خودکار ساخته شده استفاده کنید

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

Plugin همراه، همه سطوح DeepInfra را که با قراردادهای فعلی ارائه‌دهنده OpenClaw سازگار هستند ثبت می‌کند:

| سطح                     | مدل پیش‌فرض                       | پیکربندی/ابزار OpenClaw                                 |
| ----------------------- | --------------------------------- | -------------------------------------------------------- |
| چت / ارائه‌دهنده مدل    | `deepseek-ai/DeepSeek-V3.2`       | `agents.defaults.model`                                  |
| تولید/ویرایش تصویر     | `black-forest-labs/FLUX-1-schnell` | `image_generate`, `agents.defaults.imageGenerationModel` |
| درک رسانه               | `moonshotai/Kimi-K2.5` برای تصاویر | درک تصویر ورودی                                          |
| گفتار به متن            | `openai/whisper-large-v3-turbo`   | رونویسی صوت ورودی                                        |
| متن به گفتار            | `hexgrad/Kokoro-82M`              | `messages.tts.provider: "deepinfra"`                     |
| تولید ویدئو             | `Pixverse/Pixverse-T2V`           | `video_generate`, `agents.defaults.videoGenerationModel` |
| embeddings حافظه        | `BAAI/bge-m3`                     | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra همچنین بازرتبه‌بندی، طبقه‌بندی، تشخیص شیء و انواع مدل‌های native دیگر را ارائه می‌کند. OpenClaw در حال حاضر برای این دسته‌ها قراردادهای ارائه‌دهنده سطح‌اول ندارد، بنابراین این Plugin هنوز آن‌ها را ثبت نمی‌کند.

## مدل‌های موجود

OpenClaw هنگام راه‌اندازی، مدل‌های موجود DeepInfra را به‌صورت پویا کشف می‌کند. برای دیدن فهرست کامل مدل‌های موجود از `/models deepinfra` استفاده کنید.

هر مدلی که در [DeepInfra.com](https://deepinfra.com/) موجود باشد می‌تواند با پیشوند `deepinfra/` استفاده شود:

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...and many more
```

## نکات

- ارجاع‌های مدل به شکل `deepinfra/<provider>/<model>` هستند (مثلاً `deepinfra/Qwen/Qwen3-Max`).
- مدل پیش‌فرض: `deepinfra/deepseek-ai/DeepSeek-V3.2`
- Base URL: `https://api.deepinfra.com/v1/openai`
- تولید ویدئوی native از `https://api.deepinfra.com/v1/inference/<model>` استفاده می‌کند.
