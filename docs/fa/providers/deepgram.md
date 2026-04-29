---
read_when:
    - می‌خواهید برای پیوست‌های صوتی از تبدیل گفتار به متن Deepgram استفاده کنید
    - برای تماس صوتی، رونویسی جریانی Deepgram می‌خواهید
    - به یک نمونه پیکربندی سریع Deepgram نیاز دارید
summary: رونویسی Deepgram برای یادداشت‌های صوتی ورودی
title: Deepgram
x-i18n:
    generated_at: "2026-04-29T23:24:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 16
---

Deepgram یک API تبدیل گفتار به متن است. در OpenClaw از آن برای رونویسی
صوت/یادداشت صوتی ورودی از طریق `tools.media.audio` و برای STT پخش جریانی تماس صوتی
از طریق `plugins.entries.voice-call.config.streaming` استفاده می‌شود.

برای رونویسی دسته‌ای، OpenClaw فایل صوتی کامل را در Deepgram بارگذاری می‌کند
و متن رونویسی‌شده را به خط لوله پاسخ تزریق می‌کند (بلوک `{{Transcript}}` +
`[Audio]`). برای پخش جریانی تماس صوتی، OpenClaw فریم‌های زنده G.711
u-law را از طریق نقطه پایانی WebSocket `listen` در Deepgram ارسال می‌کند و هم‌زمان با بازگشت آن‌ها از Deepgram، رونویسی‌های جزئی یا
نهایی را منتشر می‌کند.

| جزئیات        | مقدار                                                      |
| ------------- | ---------------------------------------------------------- |
| وب‌سایت       | [deepgram.com](https://deepgram.com)                       |
| مستندات       | [developers.deepgram.com](https://developers.deepgram.com) |
| احراز هویت    | `DEEPGRAM_API_KEY`                                         |
| مدل پیش‌فرض   | `nova-3`                                                   |

## شروع به کار

<Steps>
  <Step title="کلید API خود را تنظیم کنید">
    کلید API مربوط به Deepgram را به محیط اضافه کنید:

    ```
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
    از طریق Deepgram رونویسی می‌کند و متن رونویسی‌شده را به خط لوله پاسخ تزریق می‌کند.
  </Step>
</Steps>

## گزینه‌های پیکربندی

| گزینه            | مسیر                                                         | توضیح                           |
| ----------------- | ------------------------------------------------------------ | ------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | شناسه مدل Deepgram (پیش‌فرض: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | راهنمای زبان (اختیاری)              |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | فعال‌سازی تشخیص زبان (اختیاری)  |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | فعال‌سازی نشانه‌گذاری (اختیاری)         |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | فعال‌سازی قالب‌بندی هوشمند (اختیاری)    |

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

## STT پخش جریانی تماس صوتی

Plugin همراه `deepgram` همچنین یک ارائه‌دهنده رونویسی بلادرنگ
برای Plugin تماس صوتی ثبت می‌کند.

| تنظیم         | مسیر پیکربندی                                                             | پیش‌فرض                          |
| --------------- | ----------------------------------------------------------------------- | -------------------------------- |
| کلید API         | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | به `DEEPGRAM_API_KEY` بازمی‌گردد |
| مدل           | `...deepgram.model`                                                     | `nova-3`                         |
| زبان        | `...deepgram.language`                                                  | (تنظیم نشده)                          |
| کدگذاری        | `...deepgram.encoding`                                                  | `mulaw`                          |
| نرخ نمونه‌برداری     | `...deepgram.sampleRate`                                                | `8000`                           |
| نقطه‌گذاری پایانی     | `...deepgram.endpointingMs`                                             | `800`                            |
| نتایج موقت | `...deepgram.interimResults`                                            | `true`                           |

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
تماس صوتی، صدای تلفنی را به‌صورت G.711 u-law با نرخ 8 کیلوهرتز دریافت می‌کند. ارائه‌دهنده
پخش جریانی Deepgram به‌صورت پیش‌فرض از `encoding: "mulaw"` و `sampleRate: 8000` استفاده می‌کند، بنابراین
فریم‌های رسانه‌ای Twilio را می‌توان مستقیم ارسال کرد.
</Note>

## نکات

<AccordionGroup>
  <Accordion title="احراز هویت">
    احراز هویت از ترتیب استاندارد احراز هویت ارائه‌دهنده پیروی می‌کند. `DEEPGRAM_API_KEY`
    ساده‌ترین مسیر است.
  </Accordion>
  <Accordion title="پراکسی و نقاط پایانی سفارشی">
    هنگام استفاده از پراکسی، نقاط پایانی یا سرآیندها را با `tools.media.audio.baseUrl` و
    `tools.media.audio.headers` بازنویسی کنید.
  </Accordion>
  <Accordion title="رفتار خروجی">
    خروجی از همان قواعد صوتی سایر ارائه‌دهندگان پیروی می‌کند (سقف اندازه، مهلت‌های زمانی،
    تزریق رونویسی).
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
