---
read_when:
    - می‌خواهید از گردش‌کارهای محلی ComfyUI با OpenClaw استفاده کنید
    - می‌خواهید از Comfy Cloud برای گردش‌کارهای تصویر، ویدئو یا موسیقی استفاده کنید
    - به کلیدهای پیکربندی Plugin همراه comfy نیاز دارید
summary: راه‌اندازی گردش‌کار ComfyUI برای تولید تصویر، ویدئو و موسیقی در OpenClaw
title: ComfyUI
x-i18n:
    generated_at: "2026-07-12T10:37:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74150d202a422de8e0f4b2b82d5d12bd42eb46991e8ef688832208e1a2ff7793
    source_path: providers/comfy.md
    workflow: 16
---

OpenClaw یک Plugin داخلی به نام `comfy` برای اجرای مبتنی بر گردش‌کار در ComfyUI ارائه می‌کند. این
Plugin کاملاً مبتنی بر گردش‌کار است: OpenClaw کنترل‌های عمومی مانند `size`،
`aspectRatio`، `resolution`، `durationSeconds` یا کنترل‌های مشابه TTS را به
گراف شما نگاشت نمی‌کند.

| ویژگی              | جزئیات                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| ارائه‌دهنده         | `comfy`                                                                                         |
| مدل                 | `comfy/workflow`                                                                                |
| ابزارهای مشترک      | `image_generate`، `video_generate`، `music_generate`                                            |
| احراز هویت          | برای ComfyUI محلی لازم نیست؛ برای Comfy Cloud از `COMFY_API_KEY` یا `COMFY_CLOUD_API_KEY` استفاده می‌شود |
| API                 | ComfyUI:‏ `/prompt` / `/history` / `/view`؛ Comfy Cloud:‏ `/api/*`                               |

## قابلیت‌های پشتیبانی‌شده

- تولید و ویرایش تصویر از یک فایل JSON گردش‌کار (ویرایش یک تصویر مرجع بارگذاری‌شده دریافت می‌کند)
- تولید ویدئو از یک فایل JSON گردش‌کار، به‌صورت متن‌به‌ویدئو یا تصویر‌به‌ویدئو (یک تصویر مرجع)
- تولید موسیقی/صدا از طریق ابزار مشترک `music_generate`، با یک تصویر مرجع اختیاری
- دانلود خروجی از Node پیکربندی‌شده، یا از همه Nodeهای خروجی منطبق در صورت پیکربندی‌نشدن هیچ‌کدام

## شروع به کار

بین اجرای ComfyUI روی دستگاه خودتان و استفاده از Comfy Cloud یکی را انتخاب کنید.

<Tabs>
  <Tab title="محلی">
    **بهترین گزینه برای:** اجرای نمونه ComfyUI خودتان روی دستگاه یا شبکه محلی.

    <Steps>
      <Step title="راه‌اندازی محلی ComfyUI">
        مطمئن شوید نمونه محلی ComfyUI شما در حال اجرا است (مقدار پیش‌فرض `http://127.0.0.1:8188` است).
      </Step>
      <Step title="آماده‌سازی فایل JSON گردش‌کار">
        یک فایل JSON گردش‌کار ComfyUI صادر یا ایجاد کنید. شناسه Node ورودی اعلان و Node خروجی‌ای را که می‌خواهید OpenClaw از آن بخواند، یادداشت کنید.
      </Step>
      <Step title="پیکربندی ارائه‌دهنده">
        مقدار `mode: "local"` را تنظیم کنید و مسیر فایل گردش‌کارتان را مشخص کنید. نمونه حداقلی برای تصویر:

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
      <Step title="تنظیم مدل پیش‌فرض">
        OpenClaw را برای قابلیت پیکربندی‌شده به مدل `comfy/workflow` متصل کنید:

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
      <Step title="تأیید عملکرد">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **بهترین گزینه برای:** اجرای گردش‌کارها در Comfy Cloud بدون مدیریت منابع GPU محلی.

    <Steps>
      <Step title="دریافت کلید API">
        در [comfy.org](https://comfy.org) ثبت‌نام کنید و از پیشخوان حساب خود یک کلید API بسازید.
      </Step>
      <Step title="تنظیم کلید API">
        کلید خود را با یکی از روش‌های زیر ارائه کنید:

        ```bash
        # Onboarding flag
        openclaw onboard --comfy-api-key "your-key"

        # Environment variable (preferred for daemons)
        export COMFY_API_KEY="your-key"

        # Alternative environment variable
        export COMFY_CLOUD_API_KEY="your-key"

        # Or inline in config
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="آماده‌سازی فایل JSON گردش‌کار">
        یک فایل JSON گردش‌کار ComfyUI صادر یا ایجاد کنید. شناسه Node ورودی اعلان و Node خروجی را یادداشت کنید.
      </Step>
      <Step title="پیکربندی ارائه‌دهنده">
        مقدار `mode: "cloud"` را تنظیم کنید و مسیر فایل گردش‌کارتان را مشخص کنید:

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
        در حالت ابری، مقدار پیش‌فرض `baseUrl` برابر با `https://cloud.comfy.org` است. `baseUrl` را فقط برای یک نقطه پایانی ابری سفارشی تنظیم کنید.
        </Tip>
      </Step>
      <Step title="تنظیم مدل پیش‌فرض">
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
      <Step title="تأیید عملکرد">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## پیکربندی

Comfy از تنظیمات اتصال مشترک در سطح بالا و همچنین بخش‌های گردش‌کار مختص هر قابلیت (`image`، `video`، `music`) پشتیبانی می‌کند:

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

| کلید                  | نوع                     | توضیحات                                                                                          |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `mode`                | `"local"` یا `"cloud"`  | حالت اتصال. مقدار پیش‌فرض `"local"` است.                                                        |
| `baseUrl`             | رشته                    | مقدار پیش‌فرض برای حالت محلی `http://127.0.0.1:8188` و برای حالت ابری `https://cloud.comfy.org` است. |
| `apiKey`              | رشته                    | کلید درون‌خطی اختیاری، به‌عنوان جایگزین متغیرهای محیطی `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY`. |
| `allowPrivateNetwork` | بولی                    | اجازه استفاده از `baseUrl` خصوصی/شبکه محلی در حالت ابری یا یک FQDN محلی با DNS خصوصی.          |

<Note>
در حالت `local`، نشانی‌های IP صریح local loopback/خصوصی و نام‌های سرویس تک‌بخشی مانند `http://comfyui:8188` بدون `allowPrivateNetwork` کار می‌کنند. FQDNهای دارای ظاهر عمومی اما مبتنی بر DNS خصوصی مانند `https://comfy.local.example.com` به `allowPrivateNetwork: true` نیاز دارند. اعتماد به مبدأ خصوصی فقط به طرح، نام میزبان و درگاه پیکربندی‌شده محدود می‌ماند؛ تغییرمسیرهای محلی نمی‌توانند از نام میزبان پیکربندی‌شده خارج شوند، درحالی‌که تغییرمسیرهای ابری به CDNهای عمومی با سیاست پیش‌فرض SSRF بررسی می‌شوند.
</Note>

### کلیدهای مختص هر قابلیت

این کلیدها درون بخش‌های `image`، `video` یا `music` اعمال می‌شوند:

| کلید                         | الزامی | پیش‌فرض | توضیحات                                                                                       |
| ---------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------- |
| `workflow` یا `workflowPath` | بله    | --      | فایل JSON گردش‌کار درون‌خطی، یا مسیر فایل JSON گردش‌کار ComfyUI.                             |
| `promptNodeId`               | بله    | --      | شناسه Node دریافت‌کننده اعلان متنی.                                                          |
| `promptInputName`            | خیر    | `"text"` | نام ورودی در Node اعلان.                                                                     |
| `outputNodeId`               | خیر    | --      | شناسه Node برای خواندن خروجی. در صورت حذف، از همه Nodeهای خروجی منطبق استفاده می‌شود.       |
| `pollIntervalMs`             | خیر    | `1500`  | فاصله نظرسنجی برای تکمیل کار، برحسب میلی‌ثانیه.                                              |
| `timeoutMs`                  | خیر    | `300000` | مهلت زمانی اجرای گردش‌کار، برحسب میلی‌ثانیه.                                                 |

بخش‌های `image` و `video` همچنین از یک Node ورودی تصویر مرجع پشتیبانی می‌کنند:

| کلید                  | الزامی                                | پیش‌فرض  | توضیحات                                        |
| --------------------- | ------------------------------------- | -------- | ---------------------------------------------- |
| `inputImageNodeId`    | بله (هنگام ارسال تصویر مرجع)          | --       | شناسه Node دریافت‌کننده تصویر مرجع بارگذاری‌شده. |
| `inputImageInputName` | خیر                                   | `"image"` | نام ورودی در Node تصویر.                       |

`apiKey` یک رشته صریح یا یک شیء [ارجاع محرمانه](/fa/gateway/configuration-reference#secrets) را می‌پذیرد.

## جزئیات گردش‌کار

<AccordionGroup>
  <Accordion title="گردش‌کارهای تصویر">
    مدل پیش‌فرض تصویر را روی `comfy/workflow` تنظیم کنید:

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

    برای فعال‌سازی ویرایش تصویر با یک تصویر مرجع بارگذاری‌شده، `inputImageNodeId` را به پیکربندی تصویر خود اضافه کنید:

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

  <Accordion title="گردش‌کارهای ویدئو">
    مدل پیش‌فرض ویدئو را روی `comfy/workflow` تنظیم کنید:

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

    گردش‌کارهای ویدئویی Comfy از طریق گراف پیکربندی‌شده از متن‌به‌ویدئو و تصویر‌به‌ویدئو پشتیبانی می‌کنند.

    <Note>
    OpenClaw ویدئوهای ورودی را به گردش‌کارهای Comfy ارسال نمی‌کند. فقط اعلان‌های متنی و یک تصویر مرجع به‌عنوان ورودی پشتیبانی می‌شوند.
    </Note>

  </Accordion>

  <Accordion title="گردش‌کارهای موسیقی">
    Plugin داخلی یک ارائه‌دهنده تولید موسیقی برای خروجی‌های صوتی یا موسیقی تعریف‌شده در گردش‌کار ثبت می‌کند که از طریق ابزار مشترک `music_generate` در دسترس قرار می‌گیرد. این ابزار یک تصویر مرجع اختیاری می‌پذیرد (حداکثر ۱ تصویر):

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    از بخش پیکربندی `music` برای مشخص‌کردن فایل JSON گردش‌کار صوتی و Node خروجی استفاده کنید.

  </Accordion>

  <Accordion title="سازگاری با نسخه‌های پیشین">
    پیکربندی موجود تصویر در سطح بالا (بدون بخش تو‌در‌توی `image`) همچنان کار می‌کند:

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

    OpenClaw این ساختار قدیمی را به‌عنوان پیکربندی گردش‌کار تصویر در نظر می‌گیرد. نیازی نیست فوراً مهاجرت کنید، اما بخش‌های تو‌در‌توی `image` / `video` / `music` برای راه‌اندازی‌های جدید توصیه می‌شوند. اگر فقط از تولید تصویر استفاده می‌کنید، پیکربندی مسطح قدیمی و بخش تو‌در‌توی جدید `image` از نظر عملکردی معادل هستند.

  </Accordion>

  <Accordion title="آزمون‌های زنده">
    پوشش آزمون زنده اختیاری برای Plugin داخلی وجود دارد:

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    آزمون زنده، موارد جداگانهٔ تصویر، ویدئو یا موسیقی را رد می‌کند، مگر اینکه بخش گردش‌کار متناظر Comfy پیکربندی شده باشد.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پیکربندی و استفاده از ابزار تولید تصویر.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پیکربندی و استفاده از ابزار تولید ویدئو.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    راه‌اندازی ابزار تولید موسیقی و صدا.
  </Card>
  <Card title="فهرست ارائه‌دهندگان" href="/fa/providers/index" icon="layers">
    نمای کلی همهٔ ارائه‌دهندگان و ارجاعات مدل.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    مرجع کامل پیکربندی، شامل پیش‌فرض‌های عامل.
  </Card>
</CardGroup>
