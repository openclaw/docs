---
read_when:
    - می‌خواهید از تبدیل گفتار به متن SenseAudio برای پیوست‌های صوتی استفاده کنید
    - به متغیر محیطی کلید API SenseAudio یا مسیر پیکربندی صدا نیاز دارید
summary: تبدیل گفتار به متن دسته‌ای SenseAudio برای یادداشت‌های صوتی ورودی
title: SenseAudio
x-i18n:
    generated_at: "2026-04-29T23:28:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c39e195458af94f710eb31e46d588a2c61ffe1e3461a9156c9638adae9943f8
    source_path: providers/senseaudio.md
    workflow: 16
---

# SenseAudio

SenseAudio می‌تواند پیوست‌های صوتی/یادداشت‌های صوتی ورودی را از طریق خط لولهٔ مشترک `tools.media.audio` در OpenClaw رونویسی کند. OpenClaw صدای multipart را به نقطهٔ پایانی رونویسی سازگار با OpenAI ارسال می‌کند و متن برگشتی را به‌صورت `{{Transcript}}` به‌همراه یک بلوک `[Audio]` تزریق می‌کند.

| جزئیات        | مقدار                                            |
| ------------- | ------------------------------------------------ |
| وب‌سایت       | [senseaudio.cn](https://senseaudio.cn)           |
| مستندات       | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| احراز هویت    | `SENSEAUDIO_API_KEY`                             |
| مدل پیش‌فرض   | `senseaudio-asr-pro-1.5-260319`                  |
| URL پیش‌فرض   | `https://api.senseaudio.cn/v1`                   |

## شروع به کار

<Steps>
  <Step title="کلید API خود را تنظیم کنید">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="ارائه‌دهندهٔ صدا را فعال کنید">
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
    یک پیام صوتی را از طریق هر کانال متصل ارسال کنید. OpenClaw صدا را در SenseAudio بارگذاری می‌کند و از رونویسی در خط لولهٔ پاسخ استفاده می‌کند.
  </Step>
</Steps>

## گزینه‌ها

| گزینه     | مسیر                                  | توضیح                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | شناسهٔ مدل ASR در SenseAudio             |
| `language` | `tools.media.audio.models[].language` | راهنمای اختیاری زبان              |
| `prompt`   | `tools.media.audio.prompt`            | اعلان اختیاری رونویسی       |
| `baseUrl`  | `tools.media.audio.baseUrl` or model  | بازنویسی پایهٔ سازگار با OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | سرآیندهای اضافی درخواست               |

<Note>
SenseAudio در OpenClaw فقط STT دسته‌ای است. رونویسی بی‌درنگ Voice Call همچنان از ارائه‌دهندگانی با پشتیبانی STT جریانی استفاده می‌کند.
</Note>
