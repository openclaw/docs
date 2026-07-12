---
read_when:
    - شما تبدیل گفتار به متن SenseAudio را برای پیوست‌های صوتی می‌خواهید
    - به متغیر محیطی کلید API سرویس SenseAudio یا مسیر پیکربندی صدا نیاز دارید
summary: تبدیل دسته‌ای گفتار به متن با SenseAudio برای پیام‌های صوتی ورودی
title: SenseAudio
x-i18n:
    generated_at: "2026-07-12T10:46:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2d2b310982a9e0f1afe2f95ae92d1516d490314f40b4b0e4eded25c72dfca586
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio پیوست‌های صوتی و یادداشت‌های صوتی ورودی را از طریق خط لولهٔ مشترک `tools.media.audio` در OpenClaw رونویسی می‌کند. OpenClaw فایل صوتی چندبخشی را به نقطهٔ پایانی رونویسی سازگار با OpenAI ارسال می‌کند و متن بازگشتی را به‌صورت `{{Transcript}}` به‌همراه یک بلوک `[Audio]` درج می‌کند.

| ویژگی            | مقدار                                            |
| ---------------- | ------------------------------------------------ |
| شناسهٔ ارائه‌دهنده | `senseaudio`                                     |
| Plugin           | همراه، `enabledByDefault: true`                  |
| قرارداد          | `mediaUnderstandingProviders` (صوت)              |
| متغیر محیطی احراز هویت | `SENSEAUDIO_API_KEY`                        |
| مدل پیش‌فرض      | `senseaudio-asr-pro-1.5-260319`                  |
| نشانی پیش‌فرض    | `https://api.senseaudio.cn/v1`                   |
| وب‌سایت          | [senseaudio.cn](https://senseaudio.cn)           |
| مستندات          | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## شروع به کار

<Steps>
  <Step title="کلید API خود را تنظیم کنید">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="ارائه‌دهندهٔ صوت را فعال کنید">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="یک یادداشت صوتی ارسال کنید">
    یک پیام صوتی را از طریق هر کانال متصل ارسال کنید. OpenClaw فایل
    صوتی را در SenseAudio بارگذاری می‌کند و از متن رونویسی‌شده در خط لولهٔ پاسخ استفاده می‌کند.
  </Step>
</Steps>

## گزینه‌ها

| گزینه     | مسیر                                  | توضیح                                      |
| ---------- | ------------------------------------- | ------------------------------------------ |
| `model`    | `tools.media.audio.models[].model`    | شناسهٔ مدل ASR در SenseAudio               |
| `language` | `tools.media.audio.models[].language` | راهنمای اختیاری زبان                       |
| `prompt`   | `tools.media.audio.prompt`            | دستور اختیاری رونویسی                      |
| `baseUrl`  | `tools.media.audio.baseUrl` یا مدل    | بازنویسی نشانی پایهٔ سازگار با OpenAI      |
| `headers`  | `tools.media.audio.request.headers`   | سرآیندهای اضافی درخواست                    |

<Note>
SenseAudio در OpenClaw فقط از تبدیل گفتار به متن دسته‌ای پشتیبانی می‌کند. رونویسی بلادرنگ تماس صوتی
همچنان از ارائه‌دهندگانی استفاده می‌کند که از تبدیل گفتار به متن جریانی پشتیبانی می‌کنند.
</Note>

## مرتبط

- [درک رسانه (صوت)](/fa/nodes/audio)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
