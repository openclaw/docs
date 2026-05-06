---
read_when:
    - شما تبدیل گفتار به متن SenseAudio را برای پیوست‌های صوتی می‌خواهید
    - به متغیر محیطی کلید API مربوط به SenseAudio یا مسیر پیکربندی صوت نیاز دارید
summary: تبدیل گفتار به متن دسته‌ای SenseAudio برای یادداشت‌های صوتی ورودی
title: SenseAudio
x-i18n:
    generated_at: "2026-05-06T09:39:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: f53af21c746cdd44c71485cbad669f4a01a6e5be956675c73831e7b5f15df8c4
    source_path: providers/senseaudio.md
    workflow: 16
---

SenseAudio می‌تواند پیوست‌های صوتی و یادداشت‌های صوتی ورودی را از طریق خط لوله مشترک `tools.media.audio` در OpenClaw رونویسی کند. OpenClaw صوت چندبخشی را به نقطه پایانی رونویسی سازگار با OpenAI ارسال می‌کند و متن برگشتی را به‌صورت `{{Transcript}}` به‌همراه یک بلوک `[Audio]` تزریق می‌کند.

| ویژگی         | مقدار                                            |
| ------------- | ------------------------------------------------ |
| شناسه ارائه‌دهنده | `senseaudio`                                     |
| Plugin        | همراه، `enabledByDefault: true`                  |
| قرارداد       | `mediaUnderstandingProviders` (صوت)              |
| متغیر محیطی احراز هویت | `SENSEAUDIO_API_KEY`                             |
| مدل پیش‌فرض   | `senseaudio-asr-pro-1.5-260319`                  |
| URL پیش‌فرض   | `https://api.senseaudio.cn/v1`                   |
| وب‌سایت       | [senseaudio.cn](https://senseaudio.cn)           |
| مستندات       | [senseaudio.cn/docs](https://senseaudio.cn/docs) |

## شروع به کار

<Steps>
  <Step title="کلید API خود را تنظیم کنید">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="ارائه‌دهنده صوتی را فعال کنید">
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
    یک پیام صوتی را از طریق هر کانال متصل ارسال کنید. OpenClaw صوت را در
    SenseAudio بارگذاری می‌کند و از رونویسی در خط لوله پاسخ استفاده می‌کند.
  </Step>
</Steps>

## گزینه‌ها

| گزینه     | مسیر                                  | توضیح                         |
| ---------- | ------------------------------------- | ----------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | شناسه مدل ASR در SenseAudio         |
| `language` | `tools.media.audio.models[].language` | راهنمای اختیاری زبان              |
| `prompt`   | `tools.media.audio.prompt`            | اعلان اختیاری رونویسی       |
| `baseUrl`  | `tools.media.audio.baseUrl` یا مدل  | بازنویسی پایه سازگار با OpenAI |
| `headers`  | `tools.media.audio.request.headers`   | سرآیندهای اضافی درخواست               |

<Note>
SenseAudio در OpenClaw فقط STT دسته‌ای است. رونویسی بلادرنگ تماس صوتی
همچنان از ارائه‌دهندگانی استفاده می‌کند که از STT جریانی پشتیبانی می‌کنند.
</Note>

## مرتبط

- [درک رسانه (صوت)](/fa/nodes/audio)
- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
