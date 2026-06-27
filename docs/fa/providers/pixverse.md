---
read_when:
    - می‌خواهید از تولید ویدئوی PixVerse در OpenClaw استفاده کنید
    - به تنظیم کلید API و env برای PixVerse نیاز دارید
    - می‌خواهید PixVerse را ارائه‌دهندهٔ پیش‌فرض ویدئو قرار دهید
summary: راه‌اندازی تولید ویدئو با PixVerse در OpenClaw
title: PixVerse
x-i18n:
    generated_at: "2026-06-27T18:43:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9967ec20f7a9db3413db12ed75f836ae0bee6610e765f049720988b43494d37b
    source_path: providers/pixverse.md
    workflow: 16
---

OpenClaw، `pixverse` را به‌عنوان یک Plugin خارجی رسمی برای تولید ویدیوی میزبانی‌شده PixVerse ارائه می‌کند. این Plugin، ارائه‌دهنده `pixverse` را در برابر قرارداد `videoGenerationProviders` ثبت می‌کند.

| ویژگی              | مقدار                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| شناسه ارائه‌دهنده  | `pixverse`                                                           |
| بسته Plugin        | `@openclaw/pixverse-provider`                                        |
| متغیر محیطی احراز هویت | `PIXVERSE_API_KEY`                                                   |
| پرچم راه‌اندازی اولیه | `--auth-choice pixverse-api-key`                                     |
| پرچم مستقیم CLI    | `--pixverse-api-key <key>`                                           |
| API                | PixVerse Platform API v2 (ارسال `video_id` همراه با نظرسنجی نتیجه) |
| مدل پیش‌فرض        | `pixverse/v6`                                                        |
| منطقه پیش‌فرض API  | بین‌المللی                                                           |

## شروع به کار

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install clawhub:@openclaw/pixverse-provider
    openclaw gateway restart
    ```
  </Step>
  <Step title="Set the API key">
    ```bash
    openclaw onboard --auth-choice pixverse-api-key
    ```

    راهنمای مرحله‌ای پیش از نوشتن `region` و
    `baseUrl` در پیکربندی ارائه‌دهنده، می‌پرسد که از نقطه پایانی بین‌المللی
    (`https://app-api.pixverse.ai/openapi/v2`) یا نقطه پایانی چین
    (`https://app-api.pixverseai.cn/openapi/v2`) استفاده شود.

  </Step>
  <Step title="Set PixVerse as the default video provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "pixverse/v6"
    ```
  </Step>
  <Step title="Generate a video">
    از عامل بخواهید یک ویدیو تولید کند. PixVerse به‌صورت خودکار استفاده خواهد شد.
  </Step>
</Steps>

## حالت‌ها و مدل‌های پشتیبانی‌شده

ارائه‌دهنده، مدل‌های تولید PixVerse را از طریق ابزار ویدیوی مشترک OpenClaw در دسترس می‌گذارد.

| حالت              | مدل‌ها               | ورودی مرجع              |
| -------------- | -------------------- | ----------------------- |
| متن به ویدیو     | `v6` (پیش‌فرض)، `c1` | هیچ‌کدام                |
| تصویر به ویدیو   | `v6` (پیش‌فرض)، `c1` | 1 تصویر محلی یا راه دور |

ارجاع‌های تصویر محلی پیش از درخواست تصویر به ویدیو در PixVerse بارگذاری می‌شوند. URLهای تصویر راه دور از طریق نقطه پایانی بارگذاری تصویر PixVerse به‌صورت `image_url` عبور داده می‌شوند.

| گزینه             | مقدارهای پشتیبانی‌شده                                                        |
| --------------- | --------------------------------------------------------------------------- |
| مدت‌زمان          | 1 تا 15 ثانیه                                                               |
| وضوح              | `360P`, `540P`, `720P`, `1080P`                                             |
| نسبت تصویر        | `16:9`, `4:3`, `1:1`, `3:4`, `9:16`, `2:3`, `3:2`, `21:9` برای متن به ویدیو |
| صدای تولیدشده     | `audio: true`                                                               |

<Note>
تولید قالب تصویر PixVerse هنوز از طریق `image_generate` در دسترس نیست. آن API بر پایه شناسه قالب هدایت می‌شود، درحالی‌که قرارداد مشترک تولید تصویر OpenClaw در حال حاضر بسته گزینه تایپ‌شده اختصاصی PixVerse ندارد.
</Note>

## گزینه‌های ارائه‌دهنده

ارائه‌دهنده ویدیو این کلیدهای اختیاری اختصاصی ارائه‌دهنده را می‌پذیرد:

| گزینه                               | نوع    | اثر                               |
| ------------------------------------ | ------ | --------------------------------- |
| `seed`                               | number | seed قطعی در صورت پشتیبانی       |
| `negativePrompt` / `negative_prompt` | string | اعلان منفی                        |
| `quality`                            | string | کیفیت PixVerse مانند `720p`      |
| `motionMode` / `motion_mode`         | string | حالت حرکت تصویر به ویدیو          |
| `cameraMovement` / `camera_movement` | string | پیش‌تنظیم حرکت دوربین PixVerse   |
| `templateId` / `template_id`         | number | شناسه قالب فعال‌شده PixVerse     |

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
  <Accordion title="API region">
    OpenClaw به‌صورت پیش‌فرض از API بین‌المللی PixVerse استفاده می‌کند. هنگامی که کلید شما به منطقه پلتفرمی خاصی از PixVerse تعلق دارد، `models.providers.pixverse.region`
    را به‌صورت دستی تنظیم کنید، یا برای انتخاب آن در راهنمای مرحله‌ای راه‌اندازی از
    `openclaw onboard --auth-choice pixverse-api-key` استفاده کنید:

    | مقدار منطقه     | URL پایه API PixVerse                         |
    | --------------- | --------------------------------------------- |
    | `international` | `https://app-api.pixverse.ai/openapi/v2`      |
    | `cn`            | `https://app-api.pixverseai.cn/openapi/v2`    |

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

  <Accordion title="Custom base URL">
    `models.providers.pixverse.baseUrl` را فقط زمانی تنظیم کنید که مسیر‌دهی از طریق یک پراکسی سازگار و مورد اعتماد انجام می‌شود.
    `baseUrl` نسبت به `region` اولویت دارد.

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

  <Accordion title="Task polling">
    PixVerse از درخواست تولید، یک `video_id` برمی‌گرداند. OpenClaw تا زمانی که وظیفه موفق شود، شکست بخورد،
    یا مهلت آن تمام شود، از
    `/openapi/v2/video/result/{video_id}` نظرسنجی می‌کند.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار ناهمگام.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    تنظیمات پیش‌فرض عامل، شامل مدل تولید ویدیو.
  </Card>
</CardGroup>
