---
read_when:
    - برای پیوست‌های صوتی به تبدیل گفتار به متن Deepgram نیاز دارید
    - برای تماس صوتی، رونویسی جریانی Deepgram را می‌خواهید
    - به یک نمونه پیکربندی سریع Deepgram نیاز دارید
summary: رونویسی Deepgram برای یادداشت‌های صوتی ورودی
title: Deepgram
x-i18n:
    generated_at: "2026-07-16T17:36:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 74652e089899423d117dae6267e7c9af09e52ec91ee15e3532fcb2d705f43099
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram یک API تبدیل گفتار به متن است. OpenClaw از آن برای رونویسی صوت ورودی/یادداشت صوتی
از طریق `tools.media.audio` و برای STT جریانی تماس صوتی
از طریق `plugins.entries.voice-call.config.streaming` استفاده می‌کند.

رونویسی دسته‌ای، فایل صوتی کامل را در Deepgram بارگذاری می‌کند و
رونوشت را به خط لوله پاسخ تزریق می‌کند (بلوک `{{Transcript}}` + `[Audio]`).
جریان تماس صوتی، فریم‌های زنده G.711 u-law را از طریق نقطه پایانی
WebSocket `listen` متعلق به Deepgram ارسال می‌کند و هم‌زمان با بازگرداندن آن‌ها توسط Deepgram،
رونوشت‌های جزئی/نهایی را منتشر می‌کند.

| جزئیات        | مقدار                                                      |
| ------------- | ---------------------------------------------------------- |
| وب‌سایت       | [deepgram.com](https://deepgram.com)                       |
| مستندات          | [developers.deepgram.com](https://developers.deepgram.com) |
| احراز هویت          | `DEEPGRAM_API_KEY`                                         |
| مدل پیش‌فرض | `nova-3`                                                   |

## شروع به کار

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
    با Deepgram رونویسی می‌کند و رونوشت را به خط لوله پاسخ تزریق می‌کند.
  </Step>
</Steps>

## گزینه‌های پیکربندی

| گزینه     | مسیر                                  | توضیحات                           |
| ---------- | ------------------------------------- | ------------------------------------- |
| `model`    | `tools.media.audio.models[].model`    | شناسه مدل Deepgram (پیش‌فرض: `nova-3`) |
| `language` | `tools.media.audio.models[].language` | راهنمای زبان (اختیاری)              |

`providerOptions.deepgram` پارامترهای اضافی پرس‌وجو را مستقیماً با
درخواست `/listen` متعلق به Deepgram ادغام می‌کند، بنابراین هر نام پارامتری که Deepgram پشتیبانی می‌کند قابل استفاده است
(برای مثال `detect_language`، `punctuate`، `smart_format`):

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

## STT جریانی تماس صوتی

Plugin همراه `deepgram` همچنین یک ارائه‌دهنده رونویسی بلادرنگ
برای Plugin تماس صوتی ثبت می‌کند.

| تنظیم         | مسیر پیکربندی                                                             | پیش‌فرض                                      |
| --------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| کلید API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | در صورت نبود، از `DEEPGRAM_API_KEY` استفاده می‌کند             |
| URL پایه        | `...deepgram.baseUrl`                                                   | `DEEPGRAM_BASE_URL` یا API عمومی Deepgram |
| مدل           | `...deepgram.model`                                                     | `nova-3`                                     |
| زبان        | `...deepgram.language`                                                  | (تنظیم‌نشده)                                      |
| کدگذاری        | `...deepgram.encoding`                                                  | `mulaw`                                      |
| نرخ نمونه‌برداری     | `...deepgram.sampleRate`                                                | `8000`                                       |
| تعیین نقطه پایانی     | `...deepgram.endpointingMs`                                             | `800`                                        |
| نتایج میانی | `...deepgram.interimResults`                                            | `true`                                       |

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

برای یک [نقطه پایانی سفارشی Deepgram](https://developers.deepgram.com/reference/custom-endpoints)،
`baseUrl` را روی ریشه نقطه پایانی تنظیم کنید؛ هر مسیر پایه را دربر بگیرد، اما `/listen` را شامل نشود.
نقاط پایانی بلادرنگ، `http://`، `https://`، `ws://` و `wss://` را می‌پذیرند. HTTP
به WS نگاشت می‌شود، HTTPS به WSS نگاشت می‌شود و طرح‌های صریح WebSocket بدون تغییر باقی می‌مانند.
URLهای نادرست و طرح‌های دیگر هنگام راه‌اندازی نشست با خطا مواجه می‌شوند.

<Note>
تماس صوتی، صدای تلفنی را با قالب 8 kHz G.711 u-law دریافت می‌کند. ارائه‌دهنده
جریانی Deepgram به‌طور پیش‌فرض از `encoding: "mulaw"` و `sampleRate: 8000` استفاده می‌کند، بنابراین
فریم‌های رسانه‌ای Twilio را می‌توان مستقیماً ارسال کرد.
</Note>

## نکات

<AccordionGroup>
  <Accordion title="احراز هویت">
    احراز هویت از ترتیب استاندارد احراز هویت ارائه‌دهنده پیروی می‌کند. `DEEPGRAM_API_KEY`
    ساده‌ترین مسیر است.
  </Accordion>
  <Accordion title="پروکسی و نقاط پایانی سفارشی">
    هنگام استفاده از پروکسی، نقاط پایانی یا سرآیندها را با `tools.media.audio.baseUrl` و
    `tools.media.audio.headers` بازنویسی کنید.
  </Accordion>
  <Accordion title="رفتار خروجی">
    خروجی از همان قواعد صوتی سایر ارائه‌دهندگان پیروی می‌کند (محدودیت‌های اندازه، مهلت‌های زمانی،
    تزریق رونوشت).
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ابزارهای رسانه" href="/fa/tools/media-overview" icon="photo-film">
    نمای کلی خط لوله پردازش صوت، تصویر و ویدئو.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی، شامل تنظیمات ابزار رسانه.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و مراحل اشکال‌زدایی.
  </Card>
  <Card title="پرسش‌های متداول" href="/fa/help/faq" icon="circle-question">
    پرسش‌های متداول درباره راه‌اندازی OpenClaw.
  </Card>
</CardGroup>
