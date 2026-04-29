---
read_when:
    - می‌خواهید از تولید ویدیوی Alibaba Wan در OpenClaw استفاده کنید
    - برای تولید ویدیو باید کلید API در Model Studio یا DashScope تنظیم شده باشد
summary: تولید ویدئو با Alibaba Model Studio Wan در OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-29T23:22:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw یک ارائه‌دهندهٔ تولید ویدیوی بسته‌بندی‌شده با نام `alibaba` برای مدل‌های Wan روی
Alibaba Model Studio / DashScope ارائه می‌کند.

- ارائه‌دهنده: `alibaba`
- احراز هویت ترجیحی: `MODELSTUDIO_API_KEY`
- موارد پذیرفته‌شدهٔ دیگر: `DASHSCOPE_API_KEY`، `QWEN_API_KEY`
- API: تولید ویدیوی ناهمگام DashScope / Model Studio

## شروع به کار

<Steps>
  <Step title="تنظیم یک کلید API">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="تنظیم یک مدل ویدیوی پیش‌فرض">
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
  <Step title="بررسی در دسترس بودن ارائه‌دهنده">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
هرکدام از کلیدهای احراز هویت پذیرفته‌شده (`MODELSTUDIO_API_KEY`، `DASHSCOPE_API_KEY`، `QWEN_API_KEY`) کار می‌کند. گزینهٔ راه‌اندازی `qwen-standard-api-key`، اعتبارنامهٔ مشترک DashScope را پیکربندی می‌کند.
</Note>

## مدل‌های داخلی Wan

ارائه‌دهندهٔ بسته‌بندی‌شدهٔ `alibaba` در حال حاضر این موارد را ثبت می‌کند:

| ارجاع مدل                  | حالت                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | تبدیل متن به ویدیو             |
| `alibaba/wan2.6-i2v`       | تبدیل تصویر به ویدیو            |
| `alibaba/wan2.6-r2v`       | تبدیل مرجع به ویدیو        |
| `alibaba/wan2.6-r2v-flash` | تبدیل مرجع به ویدیو (سریع) |
| `alibaba/wan2.7-r2v`       | تبدیل مرجع به ویدیو        |

## محدودیت‌های کنونی

| پارامتر             | محدودیت                                                     |
| --------------------- | --------------------------------------------------------- |
| ویدیوهای خروجی         | تا **1** مورد در هر درخواست                                   |
| تصاویر ورودی          | تا **1** مورد                                               |
| ویدیوهای ورودی          | تا **4** مورد                                               |
| مدت‌زمان              | تا **10 ثانیه**                                      |
| کنترل‌های پشتیبانی‌شده    | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| تصویر/ویدیوی مرجع | فقط URLهای راه دور `http(s)`                                |

<Warning>
حالت تصویر/ویدیوی مرجع در حال حاضر به **URLهای راه دور http(s)** نیاز دارد. مسیرهای فایل محلی برای ورودی‌های مرجع پشتیبانی نمی‌شوند.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="رابطه با Qwen">
    ارائه‌دهندهٔ بسته‌بندی‌شدهٔ `qwen` نیز برای تولید ویدیوی Wan از نقاط پایانی DashScope میزبانی‌شده توسط Alibaba استفاده می‌کند. استفاده کنید از:

    - `qwen/...` وقتی سطح رسمی ارائه‌دهندهٔ Qwen را می‌خواهید
    - `alibaba/...` وقتی سطح مستقیم ویدیوی Wan متعلق به فروشنده را می‌خواهید

    برای جزئیات بیشتر، [مستندات ارائه‌دهندهٔ Qwen](/fa/providers/qwen) را ببینید.

  </Accordion>

  <Accordion title="اولویت کلید احراز هویت">
    OpenClaw کلیدهای احراز هویت را به این ترتیب بررسی می‌کند:

    1. `MODELSTUDIO_API_KEY` (ترجیحی)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    هرکدام از این‌ها ارائه‌دهندهٔ `alibaba` را احراز هویت می‌کند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدیوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Qwen" href="/fa/providers/qwen" icon="microchip">
    راه‌اندازی ارائه‌دهندهٔ Qwen و یکپارچه‌سازی DashScope.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل و پیکربندی مدل.
  </Card>
</CardGroup>
