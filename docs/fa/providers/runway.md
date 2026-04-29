---
read_when:
    - می‌خواهید از تولید ویدیوی Runway در OpenClaw استفاده کنید
    - به راه‌اندازی کلید API و env برای Runway نیاز دارید
    - می‌خواهید Runway را ارائه‌دهندهٔ پیش‌فرض ویدئو قرار دهید
summary: راه‌اندازی تولید ویدیو با Runway در OpenClaw
title: باند پرواز
x-i18n:
    generated_at: "2026-04-29T23:28:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw یک ارائه‌دهندهٔ همراه `runway` برای تولید ویدیوی میزبانی‌شده ارائه می‌کند.

| ویژگی       | مقدار                                                            |
| ----------- | ----------------------------------------------------------------- |
| شناسه ارائه‌دهنده | `runway`                                                          |
| احراز هویت  | `RUNWAYML_API_SECRET` (اصلی) یا `RUNWAY_API_KEY`             |
| API         | تولید ویدیوی مبتنی بر وظیفه در Runway (نظرسنجی `GET /v1/tasks/{id}`) |

## شروع کار

<Steps>
  <Step title="تنظیم کلید API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="تنظیم Runway به‌عنوان ارائه‌دهندهٔ پیش‌فرض ویدیو">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="تولید یک ویدیو">
    از agent بخواهید یک ویدیو تولید کند. Runway به‌صورت خودکار استفاده خواهد شد.
  </Step>
</Steps>

## حالت‌های پشتیبانی‌شده

| حالت           | مدل               | ورودی مرجع              |
| -------------- | ------------------ | ----------------------- |
| متن به ویدیو   | `gen4.5` (پیش‌فرض) | هیچ‌کدام                |
| تصویر به ویدیو | `gen4.5`           | 1 تصویر محلی یا راه‌دور |
| ویدیو به ویدیو | `gen4_aleph`       | 1 ویدیوی محلی یا راه‌دور |

<Note>
ارجاع‌های تصویر و ویدیوی محلی از طریق URIهای داده پشتیبانی می‌شوند. اجراهای فقط متنی
در حال حاضر نسبت‌های تصویر `16:9` و `9:16` را ارائه می‌کنند.
</Note>

<Warning>
ویدیو به ویدیو در حال حاضر به‌طور خاص به `runway/gen4_aleph` نیاز دارد.
</Warning>

## پیکربندی

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="نام‌های مستعار متغیر محیطی">
    OpenClaw هر دو `RUNWAYML_API_SECRET` (اصلی) و `RUNWAY_API_KEY` را می‌شناسد.
    هر یک از این متغیرها ارائه‌دهندهٔ Runway را احراز هویت می‌کند.
  </Accordion>

  <Accordion title="نظرسنجی وظیفه">
    Runway از یک API مبتنی بر وظیفه استفاده می‌کند. پس از ارسال درخواست تولید، OpenClaw
    تا آماده شدن ویدیو، `GET /v1/tasks/{id}` را نظرسنجی می‌کند. برای رفتار نظرسنجی
    به پیکربندی اضافه‌ای نیاز نیست.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده و رفتار ناهمگام.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    تنظیمات پیش‌فرض agent شامل مدل تولید ویدیو.
  </Card>
</CardGroup>
