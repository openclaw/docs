---
read_when:
    - می‌خواهید از گردش‌کارهای محلی ComfyUI با OpenClaw استفاده کنید
    - می‌خواهید از Comfy Cloud با گردش‌کارهای تصویر، ویدیو یا موسیقی استفاده کنید
    - به کلیدهای پیکربندی Plugin همراه comfy نیاز دارید
summary: راه‌اندازی تولید تصویر، ویدئو و موسیقی با گردش‌کار ComfyUI در OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-04-29T23:24:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 41dda4be24d5b2c283fa499a345cf9f38747ec19b4010163ceffd998307ca086
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw یک Plugin همراه با نام `comfy` برای اجرای ComfyUI مبتنی بر گردش کار ارائه می‌کند. این Plugin کاملاً مبتنی بر گردش کار است، بنابراین OpenClaw تلاش نمی‌کند کنترل‌های عمومی `size`، `aspectRatio`، `resolution`، `durationSeconds` یا کنترل‌های سبک TTS را به گراف شما نگاشت کند.

| ویژگی           | جزئیات                                                                          |
| --------------- | -------------------------------------------------------------------------------- |
| ارائه‌دهنده     | `comfy`                                                                          |
| مدل‌ها          | `comfy/workflow`                                                                 |
| سطح‌های مشترک   | `image_generate`، `video_generate`، `music_generate`                             |
| احراز هویت      | برای ComfyUI محلی هیچ موردی نیست؛ `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` برای Comfy Cloud |
| API             | ComfyUI `/prompt` / `/history` / `/view` و Comfy Cloud `/api/*`                |

## چه چیزهایی پشتیبانی می‌شود

- تولید تصویر از یک JSON گردش کار
- ویرایش تصویر با 1 تصویر مرجع بارگذاری‌شده
- تولید ویدیو از یک JSON گردش کار
- تولید ویدیو با 1 تصویر مرجع بارگذاری‌شده
- تولید موسیقی یا صدا از طریق ابزار مشترک `music_generate`
- دانلود خروجی از یک گره پیکربندی‌شده یا همه گره‌های خروجی منطبق

## شروع به کار

بین اجرای ComfyUI روی دستگاه خودتان یا استفاده از Comfy Cloud یکی را انتخاب کنید.

<Tabs>
  <Tab title="محلی">
    **بهترین برای:** اجرای نمونه ComfyUI خودتان روی دستگاه یا LAN خودتان.

    <Steps>
      <Step title="ComfyUI را به‌صورت محلی شروع کنید">
        مطمئن شوید نمونه ComfyUI محلی شما در حال اجراست (پیش‌فرض `http://127.0.0.1:8188` است).
      </Step>
      <Step title="JSON گردش کار خود را آماده کنید">
        یک فایل JSON گردش کار ComfyUI صادر یا ایجاد کنید. شناسه‌های گره را برای گره ورودی پرامپت و گره خروجی‌ای که می‌خواهید OpenClaw از آن بخواند یادداشت کنید.
      </Step>
      <Step title="ارائه‌دهنده را پیکربندی کنید">
        `mode: "local"` را تنظیم کنید و به فایل گردش کار خود اشاره کنید. این یک نمونه حداقلی تصویر است:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="مدل پیش‌فرض را تنظیم کنید">
        OpenClaw را برای قابلیتی که پیکربندی کرده‌اید به مدل `comfy/workflow` اشاره دهید:

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="راستی‌آزمایی کنید">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **بهترین برای:** اجرای گردش‌های کار روی Comfy Cloud بدون مدیریت منابع GPU محلی.

    <Steps>
      <Step title="یک کلید API دریافت کنید">
        در [comfy.org](https://comfy.org) ثبت‌نام کنید و از داشبورد حساب خود یک کلید API بسازید.
      </Step>
      <Step title="کلید API را تنظیم کنید">
        کلید خود را از طریق یکی از این روش‌ها ارائه کنید:

        ```bash
        # Environment variable (preferred)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="JSON گردش کار خود را آماده کنید">
        یک فایل JSON گردش کار ComfyUI صادر یا ایجاد کنید. شناسه‌های گره را برای گره ورودی پرامپت و گره خروجی یادداشت کنید.
      </Step>
      <Step title="ارائه‌دهنده را پیکربندی کنید">
        `mode: "cloud"` را تنظیم کنید و به فایل گردش کار خود اشاره کنید:

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        حالت ابری مقدار پیش‌فرض `baseUrl` را `https://cloud.comfy.org` قرار می‌دهد. فقط زمانی لازم است `baseUrl` را تنظیم کنید که از یک endpoint ابری سفارشی استفاده می‌کنید.
        </Tip>
      </Step>
      <Step title="مدل پیش‌فرض را تنظیم کنید">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="راستی‌آزمایی کنید">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## پیکربندی

Comfy از تنظیمات اتصال مشترک سطح بالا به‌همراه بخش‌های گردش کار به‌ازای هر قابلیت (`image`، `video`، `music`) پشتیبانی می‌کند:

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### کلیدهای مشترک

| کلید                  | نوع                    | توضیح                                                                                 |
| --------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `mode`                | `"local"` یا `"cloud"` | حالت اتصال.                                                                          |
| `baseUrl`             | string                 | برای محلی به‌صورت پیش‌فرض `http://127.0.0.1:8188` و برای ابر `https://cloud.comfy.org` است. |
| `apiKey`              | string                 | کلید درون‌خطی اختیاری، جایگزین متغیرهای محیطی `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | boolean                | اجازه دادن به یک `baseUrl` خصوصی/LAN در حالت ابری.                                   |

### کلیدهای هر قابلیت

این کلیدها داخل بخش‌های `image`، `video` یا `music` اعمال می‌شوند:

| کلید                         | ضروری | پیش‌فرض  | توضیح                                                                       |
| ---------------------------- | -------- | -------- | ---------------------------------------------------------------------------- |
| `workflow` یا `workflowPath` | بله      | --       | مسیر فایل JSON گردش کار ComfyUI.                                           |
| `promptNodeId`               | بله      | --       | شناسه گرهی که پرامپت متنی را دریافت می‌کند.                                |
| `promptInputName`            | خیر      | `"text"` | نام ورودی روی گره پرامپت.                                                   |
| `outputNodeId`               | خیر      | --       | شناسه گرهی که خروجی از آن خوانده می‌شود. اگر حذف شود، همه گره‌های خروجی منطبق استفاده می‌شوند. |
| `pollIntervalMs`             | خیر      | --       | فاصله polling بر حسب میلی‌ثانیه برای تکمیل کار.                             |
| `timeoutMs`                  | خیر      | --       | مهلت زمانی بر حسب میلی‌ثانیه برای اجرای گردش کار.                           |

بخش‌های `image` و `video` همچنین پشتیبانی می‌کنند از:

| کلید                  | ضروری                                | پیش‌فرض   | توضیح                                            |
| --------------------- | ------------------------------------ | --------- | --------------------------------------------------- |
| `inputImageNodeId`    | بله (هنگام ارسال یک تصویر مرجع)      | --        | شناسه گرهی که تصویر مرجع بارگذاری‌شده را دریافت می‌کند. |
| `inputImageInputName` | خیر                                  | `"image"` | نام ورودی روی گره تصویر.                          |

## جزئیات گردش کار

<AccordionGroup>
  <Accordion title="گردش‌های کار تصویر">
    مدل تصویر پیش‌فرض را روی `comfy/workflow` تنظیم کنید:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **نمونه ویرایش با تصویر مرجع:**

    برای فعال کردن ویرایش تصویر با یک تصویر مرجع بارگذاری‌شده، `inputImageNodeId` را به پیکربندی تصویر خود اضافه کنید:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="گردش‌های کار ویدیو">
    مدل ویدیوی پیش‌فرض را روی `comfy/workflow` تنظیم کنید:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    گردش‌های کار ویدیوی Comfy از متن‌به‌ویدیو و تصویر‌به‌ویدیو از طریق گراف پیکربندی‌شده پشتیبانی می‌کنند.

    <Note>
    OpenClaw ویدیوهای ورودی را به گردش‌های کار Comfy ارسال نمی‌کند. فقط پرامپت‌های متنی و تصاویر مرجع تکی به‌عنوان ورودی پشتیبانی می‌شوند.
    </Note>

  </Accordion>

  <Accordion title="گردش‌های کار موسیقی">
    Plugin همراه، یک ارائه‌دهنده تولید موسیقی را برای خروجی‌های صوتی یا موسیقی تعریف‌شده با گردش کار ثبت می‌کند که از طریق ابزار مشترک `music_generate` در دسترس قرار می‌گیرد:

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    از بخش پیکربندی `music` برای اشاره به JSON گردش کار صوتی و گره خروجی خود استفاده کنید.

  </Accordion>

  <Accordion title="سازگاری روبه‌عقب">
    پیکربندی تصویر سطح بالای موجود (بدون بخش تودرتوی `image`) همچنان کار می‌کند:

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw آن شکل قدیمی را به‌عنوان پیکربندی گردش کار تصویر در نظر می‌گیرد. لازم نیست فوراً مهاجرت کنید، اما بخش‌های تودرتوی `image` / `video` / `music` برای راه‌اندازی‌های جدید توصیه می‌شوند.

    <Tip>
    اگر فقط از تولید تصویر استفاده می‌کنید، پیکربندی تخت قدیمی و بخش تودرتوی جدید `image` از نظر عملکردی معادل هستند.
    </Tip>

  </Accordion>

  <Accordion title="آزمون‌های زنده">
    پوشش زنده اختیاری برای Plugin همراه وجود دارد:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    آزمون زنده موارد جداگانه تصویر، ویدیو یا موسیقی را رد می‌کند مگر اینکه بخش گردش کار Comfy متناظر پیکربندی شده باشد.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پیکربندی و استفاده از ابزار تولید تصویر.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پیکربندی و استفاده از ابزار تولید ویدیو.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    راه‌اندازی ابزار تولید موسیقی و صدا.
  </Card>
  <Card title="فهرست ارائه‌دهنده‌ها" href="/fa/providers/index" icon="layers">
    نمای کلی همه ارائه‌دهنده‌ها و ارجاع‌های مدل.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    مرجع کامل پیکربندی، شامل پیش‌فرض‌های عامل.
  </Card>
</CardGroup>
