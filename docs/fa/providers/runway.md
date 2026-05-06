---
read_when:
    - می‌خواهید از تولید ویدئوی Runway در OpenClaw استفاده کنید
    - به کلید API و راه‌اندازی محیط Runway نیاز دارید
    - می‌خواهید Runway را ارائه‌دهندهٔ پیش‌فرض ویدئو کنید
summary: راه‌اندازی تولید ویدئو با Runway در OpenClaw
title: باند پرواز
x-i18n:
    generated_at: "2026-05-06T09:39:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw یک ارائه‌دهنده‌ی bundled با نام `runway` برای تولید ویدیوی میزبانی‌شده ارائه می‌کند. این Plugin به‌طور پیش‌فرض فعال است و ارائه‌دهنده‌ی `runway` را برای قرارداد `videoGenerationProviders` ثبت می‌کند.

| ویژگی | مقدار |
| --------------- | ----------------------------------------------------------------- |
| شناسه‌ی ارائه‌دهنده | `runway` |
| Plugin | bundled، `enabledByDefault: true` |
| متغیرهای محیطی احراز هویت | `RUNWAYML_API_SECRET` (canonical) یا `RUNWAY_API_KEY` |
| پرچم راه‌اندازی اولیه | `--auth-choice runway-api-key` |
| پرچم مستقیم CLI | `--runway-api-key <key>` |
| API | تولید ویدیوی وظیفه‌محور Runway (نظرسنجی `GET /v1/tasks/{id}`) |
| مدل پیش‌فرض | `runway/gen4.5` |

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="تنظیم Runway به‌عنوان ارائه‌دهنده‌ی پیش‌فرض ویدیو">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="تولید یک ویدیو">
    از عامل بخواهید یک ویدیو تولید کند. Runway به‌طور خودکار استفاده خواهد شد.
  </Step>
</Steps>

## حالت‌ها و مدل‌های پشتیبانی‌شده

این ارائه‌دهنده هفت مدل Runway را در سه حالت ارائه می‌کند. یک شناسه‌ی مدل می‌تواند بیش از یک حالت را پوشش دهد (برای مثال `gen4.5` هم برای متن‌به‌ویدیو و هم برای تصویر‌به‌ویدیو کار می‌کند).

| حالت | مدل‌ها | ورودی مرجع |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| متن‌به‌ویدیو | `gen4.5` (پیش‌فرض)، `veo3.1`، `veo3.1_fast`، `veo3` | ندارد |
| تصویر‌به‌ویدیو | `gen4.5`، `gen4_turbo`، `gen3a_turbo`، `veo3.1`، `veo3.1_fast`، `veo3` | ۱ تصویر محلی یا راه‌دور |
| ویدیو‌به‌ویدیو | `gen4_aleph` | ۱ ویدیوی محلی یا راه‌دور |

ارجاع‌های تصویر و ویدیوی محلی از طریق URIهای داده پشتیبانی می‌شوند.

| نسبت‌های تصویر | مقادیر مجاز |
| --------------------- | ------------------------------------------- |
| متن‌به‌ویدیو | `16:9`، `9:16` |
| ویرایش‌های تصویر و ویدیو | `1:1`، `16:9`، `9:16`، `3:4`، `4:3`، `21:9` |

<Warning>
  ویدیو‌به‌ویدیو در حال حاضر به `runway/gen4_aleph` نیاز دارد. دیگر شناسه‌های مدل Runway ورودی‌های مرجع ویدیویی را رد می‌کنند.
</Warning>

<Note>
  انتخاب یک شناسه‌ی مدل Runway از ستون نادرست، پیش از خروج درخواست API از OpenClaw یک خطای صریح ایجاد می‌کند. این ارائه‌دهنده `model` را بر اساس allowlist حالت (`TEXT_ONLY_MODELS`، `IMAGE_MODELS`، `VIDEO_MODELS`) در `extensions/runway/video-generation-provider.ts` اعتبارسنجی می‌کند.
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
    OpenClaw هر دو `RUNWAYML_API_SECRET` (canonical) و `RUNWAY_API_KEY` را می‌شناسد.
    هر یک از این متغیرها ارائه‌دهنده‌ی Runway را احراز هویت می‌کند.
  </Accordion>

  <Accordion title="نظرسنجی وظیفه">
    Runway از یک API وظیفه‌محور استفاده می‌کند. پس از ارسال درخواست تولید، OpenClaw
    تا آماده شدن ویدیو، `GET /v1/tasks/{id}` را نظرسنجی می‌کند. برای رفتار نظرسنجی به
    پیکربندی اضافی نیاز نیست.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار ناهمگام.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    تنظیمات پیش‌فرض عامل، از جمله مدل تولید ویدیو.
  </Card>
</CardGroup>
