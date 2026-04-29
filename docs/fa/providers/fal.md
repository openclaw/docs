---
read_when:
    - می‌خواهید از تولید تصویر fal در OpenClaw استفاده کنید
    - به جریان احراز هویت FAL_KEY نیاز دارید
    - شما تنظیمات پیش‌فرض fal را برای image_generate یا video_generate می‌خواهید
summary: راه‌اندازی تولید تصویر و ویدئو با fal در OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-04-29T23:24:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6789f0fa1140cf76f0206c7384a79ee8b96de4af9e1dfedc00e5a3382f742bb
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw یک ارائه‌دهندهٔ bundled با نام `fal` برای تولید تصویر و ویدیوی میزبانی‌شده ارائه می‌کند.

| ویژگی | مقدار                                                         |
| -------- | ------------------------------------------------------------- |
| ارائه‌دهنده | `fal`                                                         |
| احراز هویت     | `FAL_KEY` (اصلی؛ `FAL_API_KEY` نیز به‌عنوان fallback کار می‌کند) |
| API      | نقاط پایانی مدل fal                                           |

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="تنظیم مدل تصویر پیش‌فرض">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## تولید تصویر

ارائه‌دهندهٔ bundled تولید تصویر `fal` به‌طور پیش‌فرض از
`fal/fal-ai/flux/dev` استفاده می‌کند.

| قابلیت     | مقدار                      |
| -------------- | -------------------------- |
| حداکثر تصاویر     | 4 در هر درخواست              |
| حالت ویرایش      | فعال، 1 تصویر مرجع |
| overrideهای اندازه | پشتیبانی می‌شود                  |
| نسبت تصویر   | پشتیبانی می‌شود                  |
| وضوح     | پشتیبانی می‌شود                  |
| قالب خروجی  | `png` یا `jpeg`            |

<Warning>
نقطهٔ پایانی ویرایش تصویر fal از overrideهای `aspectRatio` پشتیبانی **نمی‌کند**.
</Warning>

وقتی خروجی PNG می‌خواهید، از `outputFormat: "png"` استفاده کنید. fal در OpenClaw کنترل
صریحی برای پس‌زمینهٔ شفاف اعلام نمی‌کند، بنابراین `background:
"transparent"` برای مدل‌های fal به‌عنوان override نادیده‌گرفته‌شده گزارش می‌شود.

برای استفاده از fal به‌عنوان ارائه‌دهندهٔ تصویر پیش‌فرض:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## تولید ویدیو

ارائه‌دهندهٔ bundled تولید ویدیوی `fal` به‌طور پیش‌فرض از
`fal/fal-ai/minimax/video-01-live` استفاده می‌کند.

| قابلیت | مقدار                                                              |
| ---------- | ------------------------------------------------------------------ |
| حالت‌ها      | متن به ویدیو، مرجع تک‌تصویری، مرجع به ویدیو Seedance |
| زمان اجرا    | جریان ارسال/وضعیت/نتیجه مبتنی بر صف برای کارهای طولانی‌مدت       |

<AccordionGroup>
  <Accordion title="مدل‌های ویدیویی موجود">
    **video-agent از HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="نمونه پیکربندی Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="نمونه پیکربندی مرجع به ویدیوی Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    مرجع به ویدیو از طریق پارامترهای مشترک `video_generate`، یعنی `images`، `videos` و `audioRefs`،
    تا 9 تصویر، 3 ویدیو و 3 مرجع صوتی را می‌پذیرد، با حداکثر 12 فایل مرجع در مجموع.

  </Accordion>

  <Accordion title="نمونه پیکربندی video-agent از HeyGen">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
برای دیدن فهرست کامل مدل‌های fal موجود، از جمله هر ورودی‌ای که اخیراً اضافه شده است،
از `openclaw models list --provider fal` استفاده کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل، از جمله انتخاب مدل تصویر و ویدیو.
  </Card>
</CardGroup>
