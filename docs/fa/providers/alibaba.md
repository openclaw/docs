---
read_when:
    - می‌خواهید از تولید ویدیو با Alibaba Wan در OpenClaw استفاده کنید
    - برای تولید ویدیو، باید کلید API مربوط به Model Studio یا DashScope را تنظیم کرده باشید
summary: تولید ویدیو با Alibaba Model Studio Wan در OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-05-06T09:36:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: c390da201e2c8685fafa6171a6028bf18fc676b2d46f784651f91cdc6137fdf2
    source_path: providers/alibaba.md
    workflow: 16
---

OpenClaw یک Plugin داخلی `alibaba` را همراه خود ارائه می‌دهد که یک ارائه‌دهنده تولید ویدیو برای مدل‌های Wan روی Alibaba Model Studio (نام بین‌المللی DashScope) ثبت می‌کند. این Plugin به‌صورت پیش‌فرض فعال است؛ فقط باید یک کلید API تنظیم کنید.

| ویژگی | مقدار |
| ---------------- | ------------------------------------------------------------------------------- |
| شناسه ارائه‌دهنده | `alibaba` |
| Plugin | همراه، `enabledByDefault: true` |
| متغیرهای محیطی احراز هویت | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY` (اولین مورد منطبق برنده است) |
| پرچم راه‌اندازی اولیه | `--auth-choice alibaba-model-studio-api-key` |
| پرچم مستقیم CLI | `--alibaba-model-studio-api-key <key>` |
| مدل پیش‌فرض | `alibaba/wan2.6-t2v` |
| URL پایه پیش‌فرض | `https://dashscope-intl.aliyuncs.com` |

## شروع به کار

<Steps>
  <Step title="تنظیم یک کلید API">
    برای ذخیره کلید برای ارائه‌دهنده `alibaba` از راه‌اندازی اولیه استفاده کنید:

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    یا کلید را هنگام نصب/راه‌اندازی اولیه مستقیماً وارد کنید:

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    یا پیش از راه‌اندازی Gateway، هرکدام از متغیرهای محیطی پذیرفته‌شده را export کنید:

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # or DASHSCOPE_API_KEY=...
    # or QWEN_API_KEY=...
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
  <Step title="بررسی پیکربندی بودن ارائه‌دهنده">
    ```bash
    openclaw models list --provider alibaba
    ```

    فهرست باید شامل هر پنج مدل داخلی Wan باشد. اگر `MODELSTUDIO_API_KEY` قابل حل نباشد، `openclaw models status --json` اعتبارنامه گمشده را زیر `auth.unusableProfiles` گزارش می‌کند.

  </Step>
</Steps>

<Note>
  Plugin مربوط به Alibaba و [Plugin مربوط به Qwen](/fa/providers/qwen) هر دو در برابر DashScope احراز هویت می‌کنند و متغیرهای محیطی هم‌پوشان را می‌پذیرند. برای هدایت سطح اختصاصی ویدیوی Wan از شناسه‌های مدل `alibaba/...` استفاده کنید؛ وقتی سطح چت، embedding یا درک رسانه Qwen را می‌خواهید، از شناسه‌های `qwen/...` استفاده کنید.
</Note>

## مدل‌های داخلی Wan

| ارجاع مدل | حالت |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v` | متن به ویدیو (پیش‌فرض) |
| `alibaba/wan2.6-i2v` | تصویر به ویدیو |
| `alibaba/wan2.6-r2v` | مرجع به ویدیو |
| `alibaba/wan2.6-r2v-flash` | مرجع به ویدیو (سریع) |
| `alibaba/wan2.7-r2v` | مرجع به ویدیو |

## قابلیت‌ها و محدودیت‌ها

ارائه‌دهنده داخلی، سقف‌های API ویدیوی Wan در DashScope را بازتاب می‌دهد. هر سه حالت تعداد ویدیو در هر درخواست و سقف مدت یکسانی دارند؛ فقط شکل ورودی متفاوت است.

| حالت | حداکثر ویدیوهای خروجی | حداکثر تصاویر ورودی | حداکثر ویدیوهای ورودی | حداکثر مدت | کنترل‌های پشتیبانی‌شده |
| ------------------ | ----------------- | ---------------- | ---------------- | ------------ | --------------------------------------------------------- |
| متن به ویدیو | 1 | نامرتبط | نامرتبط | 10 ثانیه | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| تصویر به ویدیو | 1 | 1 | نامرتبط | 10 ثانیه | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| مرجع به ویدیو | 1 | نامرتبط | 4 | 10 ثانیه | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |

وقتی درخواستی `durationSeconds` را حذف کند، ارائه‌دهنده مقدار پیش‌فرض پذیرفته‌شده DashScope یعنی **5 ثانیه** را می‌فرستد. برای افزایش تا 10 ثانیه، `durationSeconds` را صراحتاً روی [ابزار تولید ویدیو](/fa/tools/video-generation) تنظیم کنید.

<Warning>
  ورودی‌های تصویر و ویدیوی مرجع باید URLهای راه دور `http(s)` باشند. مسیرهای فایل محلی در حالت‌های مرجع DashScope پذیرفته نمی‌شوند؛ ابتدا در فضای ذخیره‌سازی شیء آپلود کنید یا از جریان [ابزار رسانه](/fa/tools/media-overview) استفاده کنید که از قبل یک URL عمومی تولید می‌کند.
</Warning>

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="نادیده‌گرفتن URL پایه DashScope">
    ارائه‌دهنده به‌صورت پیش‌فرض از endpoint بین‌المللی DashScope استفاده می‌کند. برای هدف‌گیری endpoint منطقه چین، این مورد را تنظیم کنید:

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

    ارائه‌دهنده پیش از ساخت URLهای وظیفه AIGC، اسلش‌های انتهایی را حذف می‌کند.

  </Accordion>

  <Accordion title="اولویت متغیر محیطی احراز هویت">
    OpenClaw کلید API مربوط به Alibaba را به این ترتیب از متغیرهای محیطی حل می‌کند و اولین مقدار غیرخالی را برمی‌دارد:

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    ورودی‌های پیکربندی‌شده `auth.profiles` (که از طریق `openclaw models auth login` تنظیم می‌شوند) حل متغیر محیطی را نادیده می‌گیرند. برای چرخش پروفایل، cooldown و سازوکارهای نادیده‌گیری، [پروفایل‌های احراز هویت در پرسش‌های متداول مدل‌ها](/fa/help/faq-models#what-is-an-auth-profile) را ببینید.

  </Accordion>

  <Accordion title="ارتباط با Plugin مربوط به Qwen">
    هر دو Plugin داخلی با DashScope ارتباط می‌گیرند و کلیدهای API هم‌پوشان را می‌پذیرند. استفاده کنید از:

    - شناسه‌های `alibaba/wan*.*` برای هدایت ارائه‌دهنده اختصاصی ویدیوی Wan که در این صفحه مستند شده است.
    - شناسه‌های `qwen/*` برای چت، embedding و درک رسانه Qwen ([Qwen](/fa/providers/qwen) را ببینید).

    تنظیم یک‌باره `MODELSTUDIO_API_KEY` هر دو Plugin را احراز هویت می‌کند، چون فهرست متغیرهای محیطی احراز هویت عمداً هم‌پوشانی دارد؛ لازم نیست هر Plugin را جداگانه راه‌اندازی اولیه کنید.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Qwen" href="/fa/providers/qwen" icon="microchip">
    راه‌اندازی چت، embedding و درک رسانه Qwen روی همان احراز هویت DashScope.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل و پیکربندی مدل.
  </Card>
  <Card title="پرسش‌های متداول مدل‌ها" href="/fa/help/faq-models" icon="circle-question">
    پروفایل‌های احراز هویت، تعویض مدل‌ها، و حل خطاهای «بدون پروفایل».
  </Card>
</CardGroup>
