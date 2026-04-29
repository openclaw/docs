---
read_when:
    - می‌خواهید عامل‌ها ویرایش‌های کد یا مارک‌داون را در قالب تفاوت‌ها نشان دهند
    - یک URL نمایشگر آماده برای بوم یا یک فایل diff رندرشده می‌خواهید
    - به آرتیفکت‌های تفاوتِ کنترل‌شده و موقت با پیش‌فرض‌های امن نیاز دارید
sidebarTitle: Diffs
summary: نمایشگر تفاوت‌ها و رندرکنندهٔ فایل به‌صورت فقط‌خواندنی برای عامل‌ها (ابزار اختیاری Plugin)
title: تفاوت‌ها
x-i18n:
    generated_at: "2026-04-29T23:41:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d8938b11f6bc612168057b7f4f5ceaafb22c2445e015fb746795b2e93f033e5
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` یک ابزار اختیاری Plugin با راهنمای کوتاه داخلی برای سیستم و یک Skills همراه است که محتوای تغییر را به یک مصنوع diff فقط‌خواندنی برای عامل‌ها تبدیل می‌کند.

دو نوع ورودی می‌پذیرد:

- متن `before` و `after`
- یک `patch` یکپارچه

می‌تواند این موارد را برگرداند:

- یک URL نمایشگر Gateway برای ارائه در canvas
- یک مسیر فایل رندرشده (PNG یا PDF) برای تحویل پیام
- هر دو خروجی در یک فراخوانی

وقتی فعال باشد، Plugin راهنمای استفاده مختصر را به فضای system-prompt اضافه می‌کند و همچنین یک Skills دقیق را برای مواردی ارائه می‌دهد که عامل به دستورالعمل‌های کامل‌تر نیاز دارد.

## شروع سریع

<Steps>
  <Step title="فعال‌کردن Plugin">
    ```json5
    {
      plugins: {
        entries: {
          diffs: {
            enabled: true,
          },
        },
      },
    }
    ```
  </Step>
  <Step title="انتخاب یک حالت">
    <Tabs>
      <Tab title="view">
        جریان‌های canvas-محور: عامل‌ها `diffs` را با `mode: "view"` فراخوانی می‌کنند و `details.viewerUrl` را با `canvas present` باز می‌کنند.
      </Tab>
      <Tab title="file">
        تحویل فایل در گفت‌وگو: عامل‌ها `diffs` را با `mode: "file"` فراخوانی می‌کنند و `details.filePath` را با `message` با استفاده از `path` یا `filePath` ارسال می‌کنند.
      </Tab>
      <Tab title="both">
        ترکیبی: عامل‌ها `diffs` را با `mode: "both"` فراخوانی می‌کنند تا هر دو مصنوع را در یک فراخوانی دریافت کنند.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## غیرفعال‌کردن راهنمای داخلی سیستم

اگر می‌خواهید ابزار `diffs` فعال بماند اما راهنمای داخلی system-prompt آن غیرفعال شود، `plugins.entries.diffs.hooks.allowPromptInjection` را روی `false` تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
      },
    },
  },
}
```

این کار hook مربوط به `before_prompt_build` در Plugin diffs را مسدود می‌کند، در حالی که Plugin، ابزار و Skills همراه همچنان در دسترس می‌مانند.

اگر می‌خواهید هم راهنما و هم ابزار را غیرفعال کنید، به‌جای آن Plugin را غیرفعال کنید.

## گردش‌کار معمول عامل

<Steps>
  <Step title="فراخوانی diffs">
    عامل ابزار `diffs` را با ورودی فراخوانی می‌کند.
  </Step>
  <Step title="خواندن جزئیات">
    عامل فیلدهای `details` را از پاسخ می‌خواند.
  </Step>
  <Step title="ارائه">
    عامل یا `details.viewerUrl` را با `canvas present` باز می‌کند، یا `details.filePath` را با `message` با استفاده از `path` یا `filePath` ارسال می‌کند، یا هر دو کار را انجام می‌دهد.
  </Step>
</Steps>

## نمونه‌های ورودی

<Tabs>
  <Tab title="قبل و بعد">
    ```json
    {
      "before": "# Hello\n\nOne",
      "after": "# Hello\n\nTwo",
      "path": "docs/example.md",
      "mode": "view"
    }
    ```
  </Tab>
  <Tab title="Patch">
    ```json
    {
      "patch": "diff --git a/src/example.ts b/src/example.ts\n--- a/src/example.ts\n+++ b/src/example.ts\n@@ -1 +1 @@\n-const x = 1;\n+const x = 2;\n",
      "mode": "both"
    }
    ```
  </Tab>
</Tabs>

## مرجع ورودی ابزار

همه فیلدها اختیاری هستند مگر اینکه خلاف آن ذکر شده باشد.

<ParamField path="before" type="string">
  متن اصلی. وقتی `patch` حذف شده باشد، همراه با `after` الزامی است.
</ParamField>
<ParamField path="after" type="string">
  متن به‌روزشده. وقتی `patch` حذف شده باشد، همراه با `before` الزامی است.
</ParamField>
<ParamField path="patch" type="string">
  متن diff یکپارچه. با `before` و `after` ناسازگار است.
</ParamField>
<ParamField path="path" type="string">
  نام فایل نمایشی برای حالت قبل و بعد.
</ParamField>
<ParamField path="lang" type="string">
  راهنمای override زبان برای حالت قبل و بعد. مقدارهای ناشناخته به متن ساده برمی‌گردند.
</ParamField>
<ParamField path="title" type="string">
  override عنوان نمایشگر.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  حالت خروجی. مقدار پیش‌فرض، مقدار پیش‌فرض Plugin یعنی `defaults.mode` است. نام مستعار منسوخ: `"image"` مانند `"file"` رفتار می‌کند و همچنان برای سازگاری روبه‌عقب پذیرفته می‌شود.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  تم نمایشگر. مقدار پیش‌فرض، مقدار پیش‌فرض Plugin یعنی `defaults.theme` است.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  چیدمان diff. مقدار پیش‌فرض، مقدار پیش‌فرض Plugin یعنی `defaults.layout` است.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  وقتی context کامل در دسترس باشد، بخش‌های بدون تغییر را گسترش بده. فقط گزینه هر فراخوانی است (کلید پیش‌فرض Plugin نیست).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  قالب فایل رندرشده. مقدار پیش‌فرض، مقدار پیش‌فرض Plugin یعنی `defaults.fileFormat` است.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  preset کیفیت برای رندر PNG یا PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  override مقیاس دستگاه (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  حداکثر عرض رندر بر حسب پیکسل CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL مصنوع بر حسب ثانیه برای خروجی‌های نمایشگر و فایل مستقل. حداکثر 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  override مبدأ URL نمایشگر. مقدار `viewerBaseUrl` در Plugin را override می‌کند. باید `http` یا `https` باشد، بدون query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="نام‌های مستعار ورودی قدیمی">
    همچنان برای سازگاری روبه‌عقب پذیرفته می‌شوند:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="اعتبارسنجی و محدودیت‌ها">
    - `before` و `after` هرکدام حداکثر 512 KiB.
    - `patch` حداکثر 2 MiB.
    - `path` حداکثر 2048 بایت.
    - `lang` حداکثر 128 بایت.
    - `title` حداکثر 1024 بایت.
    - سقف پیچیدگی Patch: حداکثر 128 فایل و 120000 خط در مجموع.
    - استفاده هم‌زمان از `patch` و `before` یا `after` رد می‌شود.
    - محدودیت‌های ایمنی فایل رندرشده (برای PNG و PDF اعمال می‌شود):
      - `fileQuality: "standard"`: حداکثر 8 MP (8,000,000 پیکسل رندرشده).
      - `fileQuality: "hq"`: حداکثر 14 MP (14,000,000 پیکسل رندرشده).
      - `fileQuality: "print"`: حداکثر 24 MP (24,000,000 پیکسل رندرشده).
      - PDF همچنین حداکثر 50 صفحه دارد.

  </Accordion>
</AccordionGroup>

## قرارداد جزئیات خروجی

ابزار فراداده ساخت‌یافته را زیر `details` برمی‌گرداند.

<AccordionGroup>
  <Accordion title="فیلدهای نمایشگر">
    فیلدهای مشترک برای حالت‌هایی که نمایشگر ایجاد می‌کنند:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`, `sessionId`, `messageChannel`, `agentAccountId` وقتی در دسترس باشد)

  </Accordion>
  <Accordion title="فیلدهای فایل">
    فیلدهای فایل وقتی PNG یا PDF رندر می‌شود:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (همان مقدار `filePath`، برای سازگاری با ابزار پیام)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="نام‌های مستعار سازگاری">
    همچنین برای فراخواننده‌های موجود برگردانده می‌شود:

    - `format` (همان مقدار `fileFormat`)
    - `imagePath` (همان مقدار `filePath`)
    - `imageBytes` (همان مقدار `fileBytes`)
    - `imageQuality` (همان مقدار `fileQuality`)
    - `imageScale` (همان مقدار `fileScale`)
    - `imageMaxWidth` (همان مقدار `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

خلاصه رفتار حالت:

| حالت     | آنچه برگردانده می‌شود                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | فقط فیلدهای نمایشگر.                                                                                                    |
| `"file"` | فقط فیلدهای فایل، بدون آرتیفکت نمایشگر.                                                                                  |
| `"both"` | فیلدهای نمایشگر به‌همراه فیلدهای فایل. اگر رندر کردن فایل شکست بخورد، نمایشگر همچنان با نام مستعار `fileError` و `imageError` برمی‌گردد. |

## بخش‌های بدون تغییرِ جمع‌شده

- نمایشگر می‌تواند ردیف‌هایی مانند `N unmodified lines` را نشان دهد.
- کنترل‌های بازکردن روی آن ردیف‌ها شرطی هستند و برای هر نوع ورودی تضمین نمی‌شوند.
- کنترل‌های بازکردن زمانی ظاهر می‌شوند که diff رندرشده داده‌های زمینه قابل بازکردن داشته باشد، که برای ورودی قبل و بعد معمول است.
- برای بسیاری از ورودی‌های پچ یکپارچه، بدنه‌های زمینه حذف‌شده در hunkهای پچِ تجزیه‌شده در دسترس نیستند، بنابراین ردیف می‌تواند بدون کنترل‌های بازکردن ظاهر شود. این رفتار مورد انتظار است.
- `expandUnchanged` فقط زمانی اعمال می‌شود که زمینه قابل بازکردن وجود داشته باشد.

## پیش‌فرض‌های Plugin

پیش‌فرض‌های سراسری Plugin را در `~/.openclaw/openclaw.json` تنظیم کنید:

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          defaults: {
            fontFamily: "Fira Code",
            fontSize: 15,
            lineSpacing: 1.6,
            layout: "unified",
            showLineNumbers: true,
            diffIndicators: "bars",
            wordWrap: true,
            background: true,
            theme: "dark",
            fileFormat: "png",
            fileQuality: "standard",
            fileScale: 2,
            fileMaxWidth: 960,
            mode: "both",
          },
        },
      },
    },
  },
}
```

پیش‌فرض‌های پشتیبانی‌شده:

- `fontFamily`
- `fontSize`
- `lineSpacing`
- `layout`
- `showLineNumbers`
- `diffIndicators`
- `wordWrap`
- `background`
- `theme`
- `fileFormat`
- `fileQuality`
- `fileScale`
- `fileMaxWidth`
- `mode`

پارامترهای صریح ابزار این پیش‌فرض‌ها را بازنویسی می‌کنند.

### پیکربندی پایدار URL نمایشگر

<ParamField path="viewerBaseUrl" type="string">
  جایگزین تحت مالکیت Plugin برای لینک‌های نمایشگرِ برگشتی، زمانی که یک فراخوانی ابزار `baseUrl` را ارسال نمی‌کند. باید `http` یا `https` باشد، بدون query/hash.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          viewerBaseUrl: "https://gateway.example.com/openclaw",
        },
      },
    },
  },
}
```

## پیکربندی امنیت

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: درخواست‌های غیرلوپ‌بک به مسیرهای نمایشگر رد می‌شوند. `true`: اگر مسیر توکن‌دار معتبر باشد، نمایشگرهای راه‌دور مجاز هستند.
</ParamField>

```json5
{
  plugins: {
    entries: {
      diffs: {
        enabled: true,
        config: {
          security: {
            allowRemoteViewer: false,
          },
        },
      },
    },
  },
}
```

## چرخه عمر و ذخیره‌سازی آرتیفکت

- آرتیفکت‌ها زیر زیرپوشه موقت ذخیره می‌شوند: `$TMPDIR/openclaw-diffs`.
- فراداده آرتیفکت نمایشگر شامل موارد زیر است:
  - شناسه آرتیفکت تصادفی (20 نویسه hex)
  - توکن تصادفی (48 نویسه hex)
  - `createdAt` و `expiresAt`
  - مسیر ذخیره‌شده `viewer.html`
- TTL پیش‌فرض آرتیفکت، وقتی مشخص نشده باشد، 30 دقیقه است.
- بیشینه TTL پذیرفته‌شده برای نمایشگر 6 ساعت است.
- پاک‌سازی پس از ایجاد آرتیفکت به‌صورت فرصت‌طلبانه اجرا می‌شود.
- آرتیفکت‌های منقضی‌شده حذف می‌شوند.
- پاک‌سازی جایگزین، وقتی فراداده موجود نباشد، پوشه‌های مانده قدیمی‌تر از 24 ساعت را حذف می‌کند.

## URL نمایشگر و رفتار شبکه

مسیر نمایشگر:

- `/plugins/diffs/view/{artifactId}/{token}`

دارایی‌های نمایشگر:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

سند نمایشگر این دارایی‌ها را نسبت به URL نمایشگر حل می‌کند، بنابراین پیشوند مسیر اختیاری `baseUrl` برای هر دو درخواست دارایی نیز حفظ می‌شود.

رفتار ساخت URL:

- اگر `baseUrl` فراخوانی ابزار ارائه شده باشد، پس از اعتبارسنجی سخت‌گیرانه استفاده می‌شود.
- در غیر این صورت اگر `viewerBaseUrl` مربوط به Plugin پیکربندی شده باشد، از آن استفاده می‌شود.
- بدون هیچ‌یک از بازنویسی‌ها، URL نمایشگر به‌طور پیش‌فرض روی لوپ‌بک `127.0.0.1` قرار می‌گیرد.
- اگر حالت bind مربوط به Gateway برابر `custom` باشد و `gateway.customBindHost` تنظیم شده باشد، از آن میزبان استفاده می‌شود.

قواعد `baseUrl`:

- باید `http://` یا `https://` باشد.
- Query و hash رد می‌شوند.
- Origin به‌همراه مسیر پایه اختیاری مجاز است.

## مدل امنیتی

<AccordionGroup>
  <Accordion title="مقاوم‌سازی نمایشگر">
    - به‌صورت پیش‌فرض فقط لوپ‌بک.
    - مسیرهای نمایشگر توکن‌دار با اعتبارسنجی سخت‌گیرانه شناسه و توکن.
    - CSP پاسخ نمایشگر:
      - `default-src 'none'`
      - اسکریپت‌ها و دارایی‌ها فقط از خود
      - بدون `connect-src` خروجی
    - محدودسازی missهای راه‌دور هنگام فعال بودن دسترسی راه‌دور:
      - 40 شکست در هر 60 ثانیه
      - قفل 60 ثانیه‌ای (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="مستحکم‌سازی رندر کردن فایل">
    - مسیریابی درخواست‌های مرورگر اسکرین‌شات به‌طور پیش‌فرض مبتنی بر انکار است.
    - فقط دارایی‌های نمایشگر محلی از `http://127.0.0.1/plugins/diffs/assets/*` مجاز هستند.
    - درخواست‌های شبکه خارجی مسدود می‌شوند.

  </Accordion>
</AccordionGroup>

## نیازمندی‌های مرورگر برای حالت فایل

`mode: "file"` و `mode: "both"` به مرورگر سازگار با Chromium نیاز دارند.

ترتیب حل‌وفصل:

<Steps>
  <Step title="پیکربندی">
    `browser.executablePath` در پیکربندی OpenClaw.
  </Step>
  <Step title="متغیرهای محیطی">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="جایگزین پلتفرم">
    جایگزین کشف دستور/مسیر پلتفرم.
  </Step>
</Steps>

متن رایج خطا:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

با نصب Chrome، Chromium، Edge یا Brave، یا با تنظیم یکی از گزینه‌های مسیر فایل اجرایی بالا، مشکل را برطرف کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="خطاهای اعتبارسنجی ورودی">
    - `Provide patch or both before and after text.` — هم `before` و هم `after` را وارد کنید، یا `patch` ارائه دهید.
    - `Provide either patch or before/after input, not both.` — حالت‌های ورودی را با هم ترکیب نکنید.
    - `Invalid baseUrl: ...` — از مبدا `http(s)` با مسیر اختیاری استفاده کنید، بدون query/hash.
    - `{field} exceeds maximum size (...)` — اندازه payload را کاهش دهید.
    - رد شدن patch بزرگ — تعداد فایل‌های patch یا مجموع خطوط را کاهش دهید.

  </Accordion>
  <Accordion title="دسترسی‌پذیری نمایشگر">
    - URL نمایشگر به‌طور پیش‌فرض به `127.0.0.1` resolve می‌شود.
    - برای سناریوهای دسترسی راه‌دور، یکی از این کارها را انجام دهید:
      - `viewerBaseUrl` مربوط به Plugin را تنظیم کنید، یا
      - در هر فراخوانی ابزار، `baseUrl` را پاس بدهید، یا
      - از `gateway.bind=custom` و `gateway.customBindHost` استفاده کنید
    - اگر `gateway.trustedProxies` شامل loopback برای یک پراکسی روی همان میزبان باشد (برای مثال Tailscale Serve)، درخواست‌های خام نمایشگر loopback بدون هدرهای client-IP فورواردشده، طبق طراحی fail closed می‌شوند.
    - برای آن توپولوژی پراکسی:
      - وقتی فقط به یک پیوست نیاز دارید، `mode: "file"` یا `mode: "both"` را ترجیح دهید، یا
      - وقتی به URL نمایشگر قابل‌اشتراک‌گذاری نیاز دارید، عمدا `security.allowRemoteViewer` را فعال کنید و `viewerBaseUrl` مربوط به Plugin را تنظیم کنید یا یک `baseUrl` پراکسی/عمومی پاس بدهید
    - فقط زمانی `security.allowRemoteViewer` را فعال کنید که قصد دسترسی خارجی به نمایشگر را دارید.

  </Accordion>
  <Accordion title="ردیف خطوط تغییرنیافته دکمه باز کردن ندارد">
    این وضعیت ممکن است برای ورودی patch رخ دهد، وقتی patch زمینه قابل باز شدن را همراه ندارد. این مورد مورد انتظار است و نشان‌دهنده خرابی نمایشگر نیست.
  </Accordion>
  <Accordion title="Artifact پیدا نشد">
    - Artifact به‌دلیل TTL منقضی شده است.
    - توکن یا مسیر تغییر کرده است.
    - پاک‌سازی داده‌های کهنه را حذف کرده است.

  </Accordion>
</AccordionGroup>

## راهنمای عملیاتی

- برای بازبینی‌های تعاملی محلی در canvas، `mode: "view"` را ترجیح دهید.
- برای کانال‌های چت خروجی که به پیوست نیاز دارند، `mode: "file"` را ترجیح دهید.
- `allowRemoteViewer` را غیرفعال نگه دارید، مگر اینکه استقرار شما به URLهای نمایشگر راه‌دور نیاز داشته باشد.
- برای diffهای حساس، `ttlSeconds` کوتاه و صریح تنظیم کنید.
- وقتی لازم نیست، از ارسال secretها در ورودی diff خودداری کنید.
- اگر کانال شما تصاویر را شدید فشرده می‌کند (برای مثال Telegram یا WhatsApp)، خروجی PDF (`fileFormat: "pdf"`) را ترجیح دهید.

<Note>
موتور رندر diff با [Diffs](https://diffs.com) پشتیبانی می‌شود.
</Note>

## مرتبط

- [مرورگر](/fa/tools/browser)
- [Plugin‌ها](/fa/tools/plugin)
- [نمای کلی ابزارها](/fa/tools)
