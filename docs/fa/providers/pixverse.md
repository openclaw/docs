---
read_when:
    - می‌خواهید از تولید ویدئوی PixVerse در OpenClaw استفاده کنید
    - به تنظیم کلید API و متغیر محیطی PixVerse نیاز دارید
    - می‌خواهید PixVerse را به ارائه‌دهندهٔ پیش‌فرض ویدئو تبدیل کنید
summary: راه‌اندازی تولید ویدیو با PixVerse در OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-07-12T10:40:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50204c771deb315e7336325f2852e4b65dfba4264bbe288b819d44b8def1ce82
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw، `pixverse` را به‌عنوان یک Plugin خارجی رسمی برای تولید ویدیوی میزبانی‌شده PixVerse ارائه می‌کند. این Plugin، ارائه‌دهندهٔ `pixverse` را مطابق قرارداد `videoGenerationProviders` ثبت می‌کند.

| ویژگی               | مقدار                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده   | `pixverse`                                                                 |
| بستهٔ Plugin         | `@openclaw/pixverse-provider`                                              |
| متغیر محیطی احراز هویت | `PIXVERSE_API_KEY`                                                       |
| پرچم راه‌اندازی      | `--auth-choice pixverse-api-key`                                           |
| پرچم مستقیم CLI      | `--pixverse-api-key <key>`                                                 |
| API                  | PixVerse Platform API v2 (ارسال `video_id` و سپس نظرسنجی نتیجه)           |
| مدل پیش‌فرض          | `pixverse/v6`                                                              |
| منطقهٔ پیش‌فرض API   | بین‌المللی                                                                 |

## شروع به کار

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install @openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="تنظیم کلید API">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    راهنمای راه‌اندازی، پیش از نوشتن `region` و `baseUrl` در پیکربندی
    ارائه‌دهنده، نشانی پایانی بین‌المللی یا چین را درخواست می‌کند (بخش منطقهٔ API
    در ادامه را ببینید). اجرای غیرتعاملی (با کلید دریافتی از
    `--pixverse-api-key` یا `PIXVERSE_API_KEY`) به‌طور پیش‌فرض از منطقهٔ
    بین‌المللی استفاده می‌کند.

    راه‌اندازی همچنین، اگر هنوز مدل پیش‌فرضی برای ویدیو پیکربندی نشده باشد،
    `agents.defaults.videoGenerationModel.primary` را روی `pixverse/v6`
    تنظیم می‌کند.

  </Step>
  <Step title="تغییر ارائه‌دهندهٔ پیش‌فرض ویدیوی موجود (اختیاری)">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="تولید ویدیو">
    از عامل بخواهید یک ویدیو تولید کند. PixVerse به‌طور خودکار استفاده خواهد شد.
  </Step>
</Steps>

## حالت‌ها و مدل‌های پشتیبانی‌شده

این ارائه‌دهنده، مدل‌های تولید PixVerse را از طریق ابزار مشترک ویدیوی OpenClaw ارائه می‌کند.

| حالت          | مدل‌ها                | ورودی مرجع                |
| ------------- | --------------------- | ------------------------- |
| متن به ویدیو  | `v6` (پیش‌فرض)، `c1` | ندارد                     |
| تصویر به ویدیو | `v6` (پیش‌فرض)، `c1` | ۱ تصویر محلی یا راه‌دور |

مراجع تصویر محلی، پیش از درخواست تصویر به ویدیو در PixVerse بارگذاری می‌شوند. نشانی‌های URL تصاویر راه‌دور از طریق نقطهٔ پایانی بارگذاری تصویر PixVerse با نام `image_url` ارسال می‌شوند.

| گزینه          | مقادیر پشتیبانی‌شده                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| مدت‌زمان       | ۱ تا ۱۵ ثانیه (پیش‌فرض ۵)                                                                                                                      |
| وضوح           | `360P`، `540P`، `720P`، `1080P` (پیش‌فرض `540P`؛ درخواست‌های `480P` به `540P` نگاشت می‌شوند)                                                  |
| نسبت تصویر     | `16:9` (پیش‌فرض)، `4:3`، `1:1`، `3:4`، `9:16`، `2:3`، `3:2`، `21:9`؛ فقط برای متن به ویدیو، تصویر به ویدیو از تصویر مبدأ پیروی می‌کند |
| صدای تولیدشده  | `audio: true`                                                                                                                                  |

<Note>
تولید قالب تصویر PixVerse هنوز از طریق `image_generate` ارائه نمی‌شود. آن API بر پایهٔ شناسهٔ قالب کار می‌کند، درحالی‌که قرارداد مشترک تولید تصویر OpenClaw درحال‌حاضر مجموعه‌گزینهٔ نوع‌دار ویژهٔ PixVerse ندارد.
</Note>

## گزینه‌های ارائه‌دهنده

ارائه‌دهندهٔ ویدیو این کلیدهای اختیاری ویژهٔ ارائه‌دهنده را می‌پذیرد:

| گزینه                               | نوع    | اثر                                               |
| ----------------------------------- | ------ | ------------------------------------------------- |
| `seed`                              | عدد    | بذر قطعی، از ۰ تا ۲۱۴۷۴۸۳۶۴۷                     |
| `negativePrompt` / `negative_prompt` | رشته   | پرامپت منفی                                      |
| `quality`                           | رشته   | کیفیت PixVerse مانند `720p`                      |
| `motionMode` / `motion_mode`        | رشته   | حالت حرکت تصویر به ویدیو (پیش‌فرض `normal`)      |
| `cameraMovement` / `camera_movement` | رشته   | پیش‌تنظیم حرکت دوربین PixVerse                   |
| `templateId` / `template_id`        | عدد    | شناسهٔ قالب فعال‌شدهٔ PixVerse                   |

## پیکربندی

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "pixverse/v6",
      },
    },
  },
}
```

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="منطقهٔ API">
    | مقدار منطقه     | نشانی پایهٔ API مربوط به PixVerse             |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

    هنگامی که کلید شما به منطقهٔ مشخصی از پلتفرم PixVerse تعلق دارد،
    `models.providers.pixverse.region` را به‌صورت دستی تنظیم کنید، یا برای
    انتخاب منطقه در راهنمای راه‌اندازی،
    `openclaw onboard --auth-choice pixverse-api-key` را اجرا کنید:

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            region: "cn", // "international" or "cn"
            baseUrl: "https://app-api.pixverseai.cn/openapi/v2",
            models: [],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="نشانی پایهٔ سفارشی">
    `models.providers.pixverse.baseUrl` را فقط هنگام مسیریابی از طریق یک پراکسی سازگار و مورد اعتماد تنظیم کنید.
    `baseUrl` بر `region` اولویت دارد.

    ```json5
    {
      models: {
        providers: {
          pixverse: {
            baseUrl: "https://app-api.pixverse.ai/openapi/v2",
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="نظرسنجی وظیفه">
    PixVerse از درخواست تولید، یک `video_id` بازمی‌گرداند. OpenClaw هر ۵ ثانیه
    `/openapi/v2/video/result/{video_id}` را نظرسنجی می‌کند تا وظیفه موفق شود،
    شکست بخورد یا به مهلت زمانی برسد (پیش‌فرض ۵ دقیقه؛ با
    `agents.defaults.videoGenerationModel.timeoutMs` بازنویسی کنید).
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده و رفتار ناهمگام.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    تنظیمات پیش‌فرض عامل، شامل مدل تولید ویدیو.
  </Card>
</CardGroup>
