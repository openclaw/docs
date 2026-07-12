---
read_when:
    - می‌خواهید از تولید ویدیوی Alibaba Wan در OpenClaw استفاده کنید
    - برای تولید ویدیو باید کلید API مربوط به Model Studio یا DashScope را تنظیم کنید
summary: تولید ویدئو با Wan در Alibaba Model Studio در OpenClaw
title: استودیوی مدل علی‌بابا
x-i18n:
    generated_at: "2026-07-12T10:36:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cb74e2361500ccfbc5d3c4f2d08c3b62aacba8c79c704570952e2181abacf9fb
    source_path: providers/alibaba.md
    workflow: 16
---

Plugin همراه `alibaba` یک ارائه‌دهندهٔ تولید ویدئو برای مدل‌های Wan در Alibaba Model Studio (نام بین‌المللی DashScope) ثبت می‌کند. این Plugin به‌طور پیش‌فرض فعال است و فقط به یک کلید API نیاز دارد.

| ویژگی                    | مقدار                                                                           |
| ------------------------ | ------------------------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده       | `alibaba`                                                                       |
| Plugin                   | همراه، `enabledByDefault: true`                                                  |
| متغیرهای محیطی احراز هویت | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (اولین تطابق استفاده می‌شود) |
| پرچم راه‌اندازی اولیه    | `--auth-choice alibaba-model-studio-api-key`                                    |
| پرچم مستقیم CLI          | `--alibaba-model-studio-api-key <key>`                                          |
| مدل پیش‌فرض              | `alibaba/wan2.6-t2v`                                                            |
| نشانی پایهٔ پیش‌فرض      | `https://dashscope-intl.aliyuncs.com`                                           |

## شروع کار

<Steps>
  <Step title="تنظیم یک کلید API">
    کلید را از طریق راه‌اندازی اولیه برای ارائه‌دهندهٔ `alibaba` ذخیره کنید:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    یا کلید را مستقیماً وارد کنید:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    یا پیش از راه‌اندازی Gateway، یکی از متغیرهای محیطی پذیرفته‌شده را صادر کنید:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # یا DASHSCOPE_API_KEY=...
    # یا QWEN_API_KEY=...
    ```

  </Step>
  <Step title="تنظیم مدل پیش‌فرض ویدئو">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="بررسی پیکربندی ارائه‌دهنده">
    ```bash
    openclaw models list --provider alibaba
    ```

    این فهرست شامل هر پنج مدل همراه Wan است. اگر `MODELSTUDIO_API_KEY` قابل شناسایی نباشد، `openclaw models status --json` اعتبارنامهٔ موجودنبودن را در `auth.unusableProfiles` گزارش می‌کند.

  </Step>
</Steps>

<Note>
  Plugin Alibaba و [Plugin Qwen](/fa/providers/qwen) هر دو در برابر DashScope احراز هویت می‌شوند و متغیرهای محیطی مشترکی را می‌پذیرند. برای بخش اختصاصی ویدئوی Wan از شناسه‌های مدل `alibaba/...` استفاده کنید؛ برای گفت‌وگو، تعبیه‌سازی یا درک رسانه‌ای Qwen از شناسه‌های `qwen/...` استفاده کنید.
</Note>

## مدل‌های داخلی Wan

| مرجع مدل                    | حالت                       |
| -------------------------- | -------------------------- |
| `alibaba/wan2.6-t2v`       | متن به ویدئو (پیش‌فرض)     |
| `alibaba/wan2.6-i2v`       | تصویر به ویدئو             |
| `alibaba/wan2.6-r2v`       | مرجع به ویدئو              |
| `alibaba/wan2.6-r2v-flash` | مرجع به ویدئو (سریع)       |
| `alibaba/wan2.7-r2v`       | مرجع به ویدئو              |

## قابلیت‌ها و محدودیت‌ها

هر سه حالت، تعداد ویدئو و سقف مدت‌زمان یکسانی برای هر درخواست دارند و فقط ساختار ورودی آن‌ها متفاوت است.

| حالت            | حداکثر ویدئوهای خروجی | حداکثر تصاویر ورودی | حداکثر ویدئوهای ورودی | حداکثر مدت‌زمان | کنترل‌های پشتیبانی‌شده                                   |
| --------------- | --------------------- | -------------------- | --------------------- | ---------------- | -------------------------------------------------------- |
| متن به ویدئو    | 1                     | قابل‌اعمال نیست      | قابل‌اعمال نیست       | 10 ثانیه         | `size`، `aspectRatio`، `resolution`، `audio`، `watermark` |
| تصویر به ویدئو  | 1                     | 1                    | قابل‌اعمال نیست       | 10 ثانیه         | `size`، `aspectRatio`، `resolution`، `audio`، `watermark` |
| مرجع به ویدئو   | 1                     | قابل‌اعمال نیست      | 4                     | 10 ثانیه         | `size`، `aspectRatio`، `resolution`، `audio`، `watermark` |

درخواستی که `durationSeconds` را مشخص نکند، مقدار پیش‌فرض پذیرفته‌شدهٔ DashScope یعنی **۵ ثانیه** را دریافت می‌کند. برای افزایش مدت‌زمان تا ۱۰ ثانیه، `durationSeconds` را در [ابزار تولید ویدئو](/fa/tools/video-generation) به‌صراحت تنظیم کنید.

<Warning>
  ورودی‌های تصویر و ویدئوی مرجع باید نشانی‌های راه دور `http(s)` باشند؛ حالت‌های مرجع DashScope مسیرهای فایل محلی را رد می‌کنند. ابتدا فایل را در فضای ذخیره‌سازی اشیا بارگذاری کنید، یا از جریان [ابزار رسانه](/fa/tools/media-overview) استفاده کنید که از پیش یک نشانی عمومی ایجاد می‌کند.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="بازنویسی نشانی پایهٔ DashScope">
    ارائه‌دهنده به‌طور پیش‌فرض از نقطهٔ پایانی بین‌المللی DashScope استفاده می‌کند. برای استفاده از نقطهٔ پایانی منطقهٔ چین:

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    ارائه‌دهنده پیش از ساخت نشانی‌های وظیفهٔ AIGC، اسلش‌های انتهایی را حذف می‌کند.

  </Accordion>

  <Accordion title="اولویت متغیرهای محیطی احراز هویت">
    OpenClaw کلید API Alibaba را به‌ترتیب زیر از متغیرهای محیطی شناسایی می‌کند و نخستین مقدار غیرخالی را برمی‌گزیند:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    ورودی‌های پیکربندی‌شدهٔ `auth.profiles` (که با `openclaw models auth login` تنظیم می‌شوند) بر شناسایی متغیرهای محیطی اولویت دارند. برای چرخش نمایه، دورهٔ انتظار و سازوکارهای بازنویسی، به [نمایه‌های احراز هویت در پرسش‌های متداول مدل‌ها](/fa/help/faq-models#auth-profiles-what-they-are-and-how-to-manage-them) مراجعه کنید.

  </Accordion>

  <Accordion title="ارتباط با Plugin Qwen">
    هر دو Plugin همراه با DashScope ارتباط برقرار می‌کنند و کلیدهای API مشترکی را می‌پذیرند. استفاده کنید از:

    - شناسه‌های `alibaba/wan*.*` برای ارائه‌دهندهٔ اختصاصی ویدئوی Wan که در این صفحه مستند شده است.
    - شناسه‌های `qwen/*` برای گفت‌وگو، تعبیه‌سازی و درک رسانه‌ای Qwen (به [Qwen](/fa/providers/qwen) مراجعه کنید).

    تنظیم یک‌بارهٔ `MODELSTUDIO_API_KEY` هر دو Plugin را احراز هویت می‌کند، زیرا فهرست متغیرهای محیطی احراز هویت عمداً هم‌پوشانی دارد؛ راه‌اندازی اولیهٔ جداگانه برای هر Plugin ضروری نیست.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Qwen" href="/fa/providers/qwen" icon="microchip">
    راه‌اندازی گفت‌وگو، تعبیه‌سازی و درک رسانه‌ای Qwen با همان احراز هویت DashScope.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    تنظیمات پیش‌فرض عامل و پیکربندی مدل.
  </Card>
  <Card title="پرسش‌های متداول مدل‌ها" href="/fa/help/faq-models" icon="circle-question">
    نمایه‌های احراز هویت، تغییر مدل‌ها و رفع خطاهای «بدون نمایه».
  </Card>
</CardGroup>
