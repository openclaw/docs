---
read_when:
    - می‌خواهید از تولید ویدئوی Runway در OpenClaw استفاده کنید
    - به تنظیم کلید API یا متغیر محیطی Runway نیاز دارید
    - می‌خواهید Runway را به‌عنوان ارائه‌دهندهٔ پیش‌فرض ویدئو تنظیم کنید
summary: راه‌اندازی تولید ویدیو با Runway در OpenClaw
title: باند پرواز
x-i18n:
    generated_at: "2026-07-12T10:43:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw یک ارائه‌دهندهٔ داخلی `runway` برای تولید ویدیوی میزبانی‌شده عرضه می‌کند که به‌طور پیش‌فرض فعال است و بر اساس قرارداد `videoGenerationProviders` ثبت شده است.

| ویژگی                  | مقدار                                                                    |
| ---------------------- | ------------------------------------------------------------------------ |
| شناسهٔ ارائه‌دهنده     | `runway`                                                                 |
| Plugin                 | داخلی، `enabledByDefault: true`                                          |
| متغیرهای محیطی احراز هویت | `RUNWAYML_API_SECRET` (استاندارد) یا `RUNWAY_API_KEY`                  |
| پرچم راه‌اندازی اولیه  | `--auth-choice runway-api-key`                                           |
| پرچم مستقیم CLI        | `--runway-api-key <key>`                                                 |
| API                    | تولید ویدیوی وظیفه‌محور Runway (نظرسنجی `GET /v1/tasks/{id}`)           |
| مدل پیش‌فرض            | `runway/gen4.5`                                                          |

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
  <Step title="تولید ویدیو">
    از عامل بخواهید یک ویدیو تولید کند. Runway به‌طور خودکار استفاده خواهد شد.
  </Step>
</Steps>

## حالت‌ها و مدل‌های پشتیبانی‌شده

این ارائه‌دهنده هفت مدل Runway را در سه حالت عرضه می‌کند. یک شناسهٔ مدل می‌تواند در بیش از یک حالت استفاده شود (برای مثال، `gen4.5` هم برای تبدیل متن به ویدیو و هم برای تبدیل تصویر به ویدیو کار می‌کند).

| حالت                 | مدل‌ها                                                                  | ورودی مرجع                   |
| -------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| متن به ویدیو         | `gen4.5` (پیش‌فرض)، `veo3.1`، `veo3.1_fast`، `veo3`                     | ندارد                        |
| تصویر به ویدیو       | `gen4.5`، `gen4_turbo`، `gen3a_turbo`، `veo3.1`، `veo3.1_fast`، `veo3` | ۱ تصویر محلی یا راه‌دور      |
| ویدیو به ویدیو       | `gen4_aleph`                                                            | ۱ ویدیوی محلی یا راه‌دور     |

ارجاع به تصاویر و ویدیوهای محلی از طریق URIهای داده پشتیبانی می‌شود.

| نسبت‌های تصویر          | مقادیر مجاز                                  |
| ----------------------- | -------------------------------------------- |
| متن به ویدیو            | `16:9`، `9:16`                               |
| ویرایش تصویر و ویدیو    | `1:1`، `16:9`، `9:16`، `3:4`، `4:3`، `21:9` |

<Warning>
  تبدیل ویدیو به ویدیو در حال حاضر به `runway/gen4_aleph` نیاز دارد. سایر شناسه‌های مدل Runway ورودی‌های مرجع ویدیویی را رد می‌کنند.
</Warning>

<Note>
  انتخاب شناسهٔ مدل Runway از ستون نادرست، پیش از خروج درخواست API از OpenClaw خطایی صریح ایجاد می‌کند. ارائه‌دهنده در `extensions/runway/video-generation-provider.ts`، مقدار `model` را بر اساس فهرست مجاز حالت (`TEXT_ONLY_MODELS`، `IMAGE_MODELS`، `VIDEO_MODELS`) اعتبارسنجی می‌کند.
</Note>

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
    OpenClaw هر دو متغیر `RUNWAYML_API_SECRET` (استاندارد) و `RUNWAY_API_KEY` را تشخیص می‌دهد.
    هرکدام از این متغیرها ارائه‌دهندهٔ Runway را احراز هویت می‌کند.
  </Accordion>

  <Accordion title="نظرسنجی وظیفه">
    Runway از یک API وظیفه‌محور استفاده می‌کند. پس از ارسال درخواست تولید، OpenClaw
    تا آماده‌شدن ویدیو، `GET /v1/tasks/{id}` را نظرسنجی می‌کند. برای رفتار
    نظرسنجی به پیکربندی دیگری نیاز نیست.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار ناهمگام.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    تنظیمات پیش‌فرض عامل، از جمله مدل تولید ویدیو.
  </Card>
</CardGroup>
