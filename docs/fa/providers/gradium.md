---
read_when:
    - شما Gradium را برای تبدیل متن به گفتار می‌خواهید
    - به پیکربندی کلید API، صدا، یا توکن دستور Gradium نیاز دارید
summary: از تبدیل متن به گفتار Gradium در OpenClaw استفاده کنید
title: Gradium
x-i18n:
    generated_at: "2026-06-27T18:40:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5178bfaf5087e18d5d71f46d04b16d52e0e132257b9ef772b7869ac11b49a0da
    source_path: providers/gradium.md
    workflow: 16
---

[Gradium](https://gradium.ai) یک ارائه‌دهنده تبدیل متن به گفتار برای OpenClaw است. این Plugin می‌تواند پاسخ‌های صوتی عادی (WAV)، خروجی Opus سازگار با یادداشت صوتی، و صدای 8 kHz u-law را برای سطوح تلفنی تولید کند.

| ویژگی      | مقدار                                |
| ------------- | ------------------------------------ |
| شناسه ارائه‌دهنده   | `gradium`                            |
| احراز هویت          | `GRADIUM_API_KEY` یا config `apiKey` |
| URL پایه      | `https://api.gradium.ai` (پیش‌فرض)   |
| صدای پیش‌فرض | `Emma` (`YTpq7expH9539ERJ`)          |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را بازراه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/gradium-speech
openclaw gateway restart
```

## راه‌اندازی

یک کلید API برای Gradium بسازید، سپس آن را با یک env var یا کلید config در اختیار OpenClaw قرار دهید.

<Tabs>
  <Tab title="Env var">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="کلید Config">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

این Plugin ابتدا `apiKey` حل‌شده را بررسی می‌کند و در صورت نبودن آن، به متغیر محیطی `GRADIUM_API_KEY` برمی‌گردد.

## Config

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          speakerVoiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| کلید                                             | نوع   | توضیح                                                                                   |
| ----------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`         | string | کلید API حل‌شده. از `${ENV}` و ارجاع‌های محرمانه پشتیبانی می‌کند.                                          |
| `messages.tts.providers.gradium.baseUrl`        | string | مبدا API را بازنویسی می‌کند. اسلش‌های انتهایی حذف می‌شوند. مقدار پیش‌فرض `https://api.gradium.ai` است. |
| `messages.tts.providers.gradium.speakerVoiceId` | string | شناسه صدای پیش‌فرضی که وقتی بازنویسی directive وجود ندارد استفاده می‌شود.                                  |

فرمت صدای خروجی به‌صورت خودکار توسط runtime بر اساس سطح هدف انتخاب می‌شود و از `openclaw.json` قابل پیکربندی نیست. بخش [خروجی](#output) را در ادامه ببینید.

## صداها

| نام      | شناسه صدا           |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

صدای پیش‌فرض: Emma.

### بازنویسی صدای هر پیام

وقتی سیاست گفتار فعال اجازه بازنویسی صدا را می‌دهد، می‌توانید با استفاده از یک توکن directive صداها را به‌صورت درون‌خطی عوض کنید. برای شناسه‌های صدای بومی ارائه‌دهنده از `speakerVoiceId` استفاده کنید.

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

اگر سیاست گفتار بازنویسی صدا را غیرفعال کند، directive مصرف می‌شود اما نادیده گرفته می‌شود.

## خروجی

runtime فرمت خروجی را از سطح هدف انتخاب می‌کند. ارائه‌دهنده در حال حاضر فرمت‌های دیگر را تولید نمی‌کند.

| هدف         | فرمت      | پسوند فایل | نرخ نمونه‌برداری | پرچم سازگار با صدا |
| -------------- | ----------- | -------- | ----------- | --------------------- |
| صدای استاندارد | `wav`       | `.wav`   | ارائه‌دهنده    | خیر                    |
| یادداشت صوتی     | `opus`      | `.opus`  | ارائه‌دهنده    | بله                   |
| تلفنی      | `ulaw_8000` | n/a      | 8 kHz       | n/a                   |

## ترتیب انتخاب خودکار

در میان ارائه‌دهندگان TTS پیکربندی‌شده، ترتیب انتخاب خودکار Gradium برابر با `30` است. برای اینکه OpenClaw چگونه ارائه‌دهنده فعال را وقتی `messages.tts.provider` پین نشده است انتخاب می‌کند، [تبدیل متن به گفتار](/fa/tools/tts) را ببینید.

## مرتبط

- [تبدیل متن به گفتار](/fa/tools/tts)
- [نمای کلی رسانه](/fa/tools/media-overview)
