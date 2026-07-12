---
read_when:
    - برای پیوست‌های صوتی به تبدیل گفتار به متن Deepgram نیاز دارید
    - شما رونویسی جریانی Deepgram را برای تماس صوتی می‌خواهید
    - به یک نمونهٔ سریع از پیکربندی Deepgram نیاز دارید
summary: رونویسی Deepgram برای پیام‌های صوتی ورودی
title: Deepgram
x-i18n:
    generated_at: "2026-07-12T10:40:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8b0f407829ba47344ad92c5fe63aacd0ce234909c439c96370e7bd900cadff8b
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram یک API تبدیل گفتار به متن است. OpenClaw از آن برای رونویسی فایل‌های صوتی/یادداشت‌های صوتی ورودی از طریق `tools.media.audio` و برای تبدیل گفتار به متن جریانی تماس صوتی از طریق `plugins.entries.voice-call.config.streaming` استفاده می‌کند.

رونویسی دسته‌ای، فایل صوتی کامل را در Deepgram بارگذاری می‌کند و متن رونویسی‌شده را در خط لوله پاسخ (`{{Transcript}}` به‌همراه بلوک `[Audio]`) درج می‌کند. پخش جریانی تماس صوتی، فریم‌های زنده G.711 u-law را از طریق نقطه پایانی WebSocket با نام `listen` در Deepgram ارسال می‌کند و هم‌زمان با بازگرداندن نتایج توسط Deepgram، متن‌های رونویسی‌شده موقت/نهایی را منتشر می‌کند.

| جزئیات       | مقدار                                                      |
| ------------- | ---------------------------------------------------------- |
| وب‌سایت       | [deepgram.com](https://deepgram.com)                       |
| مستندات       | [developers.deepgram.com](https://developers.deepgram.com) |
| احراز هویت    | `DEEPGRAM_API_KEY`                                         |
| مدل پیش‌فرض   | `nova-3`                                                   |

## شروع کار

<Steps>
  <Step title="کلید API خود را تنظیم کنید">
    ```bash
    DEEPGRAM_API_KEY=dg_...
    ```
  </Step>
  <Step title="ارائه‌دهنده صوت را فعال کنید">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="یک یادداشت صوتی ارسال کنید">
    یک پیام صوتی را از طریق هر کانال متصل ارسال کنید. OpenClaw آن را
    با Deepgram رونویسی می‌کند و متن رونویسی‌شده را در خط لوله پاسخ درج می‌کند.
  </Step>
</Steps>

## گزینه‌های پیکربندی

| گزینه      | مسیر                                  | توضیحات                                  |
| ---------- | ------------------------------------- | ---------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | شناسه مدل Deepgram (پیش‌فرض: `nova-3`)   |
| `language` | `tools.media.audio.models[].language` | راهنمای زبان (اختیاری)                    |

`providerOptions.deepgram` پارامترهای پرس‌وجوی اضافی را مستقیماً با درخواست
`/listen` در Deepgram ادغام می‌کند؛ بنابراین می‌توان از هر نام پارامتری که
Deepgram پشتیبانی می‌کند استفاده کرد (برای مثال `detect_language`، `punctuate` و `smart_format`):

<Tabs>
  <Tab title="با راهنمای زبان">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="با گزینه‌های Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## تبدیل گفتار به متن جریانی تماس صوتی

Plugin همراه `deepgram` همچنین یک ارائه‌دهنده رونویسی بلادرنگ را برای Plugin تماس صوتی ثبت می‌کند.

| تنظیم                 | مسیر پیکربندی                                                           | پیش‌فرض                                  |
| --------------------- | ----------------------------------------------------------------------- | ---------------------------------------- |
| کلید API              | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | در صورت نبود، از `DEEPGRAM_API_KEY` استفاده می‌کند |
| مدل                   | `...deepgram.model`                                                     | `nova-3`                                 |
| زبان                  | `...deepgram.language`                                                  | (تنظیم‌نشده)                              |
| کدگذاری               | `...deepgram.encoding`                                                  | `mulaw`                                  |
| نرخ نمونه‌برداری      | `...deepgram.sampleRate`                                                | `8000`                                   |
| تشخیص پایان گفتار     | `...deepgram.endpointingMs`                                             | `800`                                    |
| نتایج موقت            | `...deepgram.interimResults`                                            | `true`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
تماس صوتی، صوت تلفنی را با قالب G.711 u-law و نرخ ۸ کیلوهرتز دریافت می‌کند. ارائه‌دهنده
پخش جریانی Deepgram به‌طور پیش‌فرض از `encoding: "mulaw"` و `sampleRate: 8000`
استفاده می‌کند؛ بنابراین فریم‌های رسانه‌ای Twilio را می‌توان مستقیماً ارسال کرد.
</Note>

## یادداشت‌ها

<AccordionGroup>
  <Accordion title="احراز هویت">
    احراز هویت از ترتیب استاندارد احراز هویت ارائه‌دهندگان پیروی می‌کند.
    `DEEPGRAM_API_KEY` ساده‌ترین روش است.
  </Accordion>
  <Accordion title="پروکسی و نقاط پایانی سفارشی">
    هنگام استفاده از پروکسی، نقاط پایانی یا سرآیندها را با
    `tools.media.audio.baseUrl` و `tools.media.audio.headers` بازنویسی کنید.
  </Accordion>
  <Accordion title="رفتار خروجی">
    خروجی از همان قواعد صوتی سایر ارائه‌دهندگان پیروی می‌کند (محدودیت اندازه،
    مهلت‌های زمانی و درج متن رونویسی‌شده).
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ابزارهای رسانه" href="/fa/tools/media-overview" icon="photo-film">
    نمای کلی خط لوله پردازش صوت، تصویر و ویدئو.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی، شامل تنظیمات ابزارهای رسانه.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و مراحل اشکال‌زدایی.
  </Card>
  <Card title="پرسش‌های متداول" href="/fa/help/faq" icon="circle-question">
    پرسش‌های متداول درباره راه‌اندازی OpenClaw.
  </Card>
</CardGroup>
