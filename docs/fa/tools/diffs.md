---
read_when:
    - می‌خواهید عامل‌ها ویرایش‌های کد یا مارک‌داون را به‌صورت دیف نشان دهند
    - شما یک URL نمایشگر آماده برای بوم یا یک فایل diff رندرشده می‌خواهید
    - به آرتیفکت‌های diff موقت و کنترل‌شده با پیش‌فرض‌های امن نیاز دارید
sidebarTitle: Diffs
summary: نمایشگر diff فقط‌خواندنی و رندرکنندهٔ فایل برای عامل‌ها (ابزار اختیاری Plugin)
title: تفاوت‌ها
x-i18n:
    generated_at: "2026-05-10T20:09:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b9a3dfcab6b4c654645075e3768c13726e10df10632d62ffeeb4de7cc41edf58
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` یک ابزار اختیاری Plugin است که راهنمای سیستمی کوتاه داخلی و یک Skill همراه دارد و محتوای تغییرات را به یک مصنوع diff فقط‌خواندنی برای عامل‌ها تبدیل می‌کند.

این ابزار یکی از این دو ورودی را می‌پذیرد:

- متن `before` و `after`
- یک `patch` یکپارچه

می‌تواند این‌ها را برگرداند:

- یک URL مشاهده‌گر Gateway برای ارائه روی بوم
- یک مسیر فایل رندرشده (PNG یا PDF) برای تحویل پیام
- هر دو خروجی در یک فراخوانی

وقتی فعال باشد، Plugin راهنمای کاربردی کوتاهی را به فضای system-prompt اضافه می‌کند و همچنین برای مواردی که عامل به دستورالعمل‌های کامل‌تری نیاز دارد، یک Skill مفصل ارائه می‌دهد.

## شروع سریع

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="فعال‌سازی Plugin">
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
        جریان‌های با اولویت بوم: عامل‌ها `diffs` را با `mode: "view"` فراخوانی می‌کنند و `details.viewerUrl` را با `canvas present` باز می‌کنند.
      </Tab>
      <Tab title="file">
        تحویل فایل در چت: عامل‌ها `diffs` را با `mode: "file"` فراخوانی می‌کنند و `details.filePath` را با `message` و با استفاده از `path` یا `filePath` ارسال می‌کنند.
      </Tab>
      <Tab title="both">
        ترکیبی: عامل‌ها `diffs` را با `mode: "both"` فراخوانی می‌کنند تا هر دو مصنوع را در یک فراخوانی دریافت کنند.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## غیرفعال کردن راهنمای سیستمی داخلی

اگر می‌خواهید ابزار `diffs` فعال بماند اما راهنمای system-prompt داخلی آن غیرفعال شود، `plugins.entries.diffs.hooks.allowPromptInjection` را روی `false` تنظیم کنید:

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

این کار hook مربوط به `before_prompt_build` در Plugin diffs را مسدود می‌کند، در حالی که خود Plugin، ابزار و Skill همراه همچنان در دسترس می‌مانند.

اگر می‌خواهید هم راهنما و هم ابزار را غیرفعال کنید، به‌جای آن خود Plugin را غیرفعال کنید.

## گردش‌کار معمول عامل

<Steps>
  <Step title="فراخوانی diffs">
    عامل ابزار `diffs` را با ورودی فراخوانی می‌کند.
  </Step>
  <Step title="خواندن details">
    عامل فیلدهای `details` را از پاسخ می‌خواند.
  </Step>
  <Step title="ارائه">
    عامل یا `details.viewerUrl` را با `canvas present` باز می‌کند، یا `details.filePath` را با `message` و با استفاده از `path` یا `filePath` ارسال می‌کند، یا هر دو کار را انجام می‌دهد.
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

همه فیلدها اختیاری هستند مگر اینکه ذکر شده باشد.

<ParamField path="before" type="string">
  متن اصلی. وقتی `patch` حذف شده باشد، همراه با `after` الزامی است.
</ParamField>
<ParamField path="after" type="string">
  متن به‌روزشده. وقتی `patch` حذف شده باشد، همراه با `before` الزامی است.
</ParamField>
<ParamField path="patch" type="string">
  متن diff یکپارچه. با `before` و `after` ناسازگار و هم‌زمان‌ناپذیر است.
</ParamField>
<ParamField path="path" type="string">
  نام فایل نمایشی برای حالت قبل و بعد.
</ParamField>
<ParamField path="lang" type="string">
  راهنمای بازنویسی زبان برای حالت قبل و بعد. مقادیر ناشناخته به متن ساده برمی‌گردند.
</ParamField>
<ParamField path="title" type="string">
  بازنویسی عنوان مشاهده‌گر.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  حالت خروجی. مقدار پیش‌فرض، پیش‌فرض Plugin یعنی `defaults.mode` است. نام مستعار منسوخ: `"image"` مانند `"file"` رفتار می‌کند و همچنان برای سازگاری با نسخه‌های قبلی پذیرفته می‌شود.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  تم مشاهده‌گر. مقدار پیش‌فرض، پیش‌فرض Plugin یعنی `defaults.theme` است.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  چیدمان diff. مقدار پیش‌فرض، پیش‌فرض Plugin یعنی `defaults.layout` است.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  بخش‌های بدون تغییر را وقتی زمینه کامل در دسترس است گسترش بده. فقط گزینه‌ای برای هر فراخوانی است (کلید پیش‌فرض Plugin نیست).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  قالب فایل رندرشده. مقدار پیش‌فرض، پیش‌فرض Plugin یعنی `defaults.fileFormat` است.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  پیش‌تنظیم کیفیت برای رندر PNG یا PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  بازنویسی مقیاس دستگاه (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  حداکثر عرض رندر بر حسب پیکسل CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL مصنوع بر حسب ثانیه برای خروجی‌های مشاهده‌گر و فایل مستقل. حداکثر 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  بازنویسی مبدأ URL مشاهده‌گر. `viewerBaseUrl` مربوط به Plugin را بازنویسی می‌کند. باید `http` یا `https` باشد و query/hash نداشته باشد.
</ParamField>

<AccordionGroup>
  <Accordion title="نام‌های مستعار ورودی قدیمی">
    همچنان برای سازگاری با نسخه‌های قبلی پذیرفته می‌شوند:

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
    - سقف پیچیدگی patch: حداکثر 128 فایل و 120000 خط در مجموع.
    - وجود هم‌زمان `patch` و `before` یا `after` رد می‌شود.
    - محدودیت‌های ایمنی فایل رندرشده (برای PNG و PDF اعمال می‌شود):
      - `fileQuality: "standard"`: حداکثر 8 MP (8,000,000 پیکسل رندرشده).
      - `fileQuality: "hq"`: حداکثر 14 MP (14,000,000 پیکسل رندرشده).
      - `fileQuality: "print"`: حداکثر 24 MP (24,000,000 پیکسل رندرشده).
      - PDF همچنین حداکثر 50 صفحه دارد.

  </Accordion>
</AccordionGroup>

## قرارداد details خروجی

ابزار فراداده ساختاریافته را زیر `details` برمی‌گرداند.

<AccordionGroup>
  <Accordion title="فیلدهای مشاهده‌گر">
    فیلدهای مشترک برای حالت‌هایی که مشاهده‌گر ایجاد می‌کنند:

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
    برای فراخواننده‌های موجود نیز برگردانده می‌شود:

    - `format` (همان مقدار `fileFormat`)
    - `imagePath` (همان مقدار `filePath`)
    - `imageBytes` (همان مقدار `fileBytes`)
    - `imageQuality` (همان مقدار `fileQuality`)
    - `imageScale` (همان مقدار `fileScale`)
    - `imageMaxWidth` (همان مقدار `fileMaxWidth`)

  </Accordion>
</AccordionGroup>

خلاصه رفتار حالت‌ها:

| حالت     | آنچه برگردانده می‌شود                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `"view"` | فقط فیلدهای مشاهده‌گر.                                                                                                    |
| `"file"` | فقط فیلدهای فایل، بدون مصنوع مشاهده‌گر.                                                                                  |
| `"both"` | فیلدهای مشاهده‌گر به‌همراه فیلدهای فایل. اگر رندر فایل شکست بخورد، مشاهده‌گر همچنان با `fileError` و نام مستعار `imageError` برمی‌گردد. |

## بخش‌های بدون تغییر جمع‌شده

- مشاهده‌گر می‌تواند ردیف‌هایی مانند `N unmodified lines` را نشان دهد.
- کنترل‌های گسترش روی آن ردیف‌ها شرطی هستند و برای هر نوع ورودی تضمین نمی‌شوند.
- کنترل‌های گسترش وقتی ظاهر می‌شوند که diff رندرشده داده زمینه قابل‌گسترش داشته باشد، که برای ورودی قبل و بعد معمول است.
- برای بسیاری از ورودی‌های patch یکپارچه، بدنه‌های زمینه حذف‌شده در hunkهای patch تجزیه‌شده در دسترس نیستند، بنابراین ردیف می‌تواند بدون کنترل‌های گسترش ظاهر شود. این رفتار مورد انتظار است.
- `expandUnchanged` فقط وقتی اعمال می‌شود که زمینه قابل‌گسترش وجود داشته باشد.

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
            ttlSeconds: 21600,
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
- `ttlSeconds`

پارامترهای صریح ابزار این پیش‌فرض‌ها را بازنویسی می‌کنند.

### پیکربندی پایدار URL مشاهده‌گر

<ParamField path="viewerBaseUrl" type="string">
  جایگزین تحت مالکیت Plugin برای پیوندهای مشاهده‌گر برگشتی وقتی یک فراخوانی ابزار `baseUrl` را ارسال نمی‌کند. باید `http` یا `https` باشد و query/hash نداشته باشد.
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
  `false`: درخواست‌های غیر-loopback به مسیرهای مشاهده‌گر رد می‌شوند. `true`: مشاهده‌گرهای راه‌دور در صورت معتبر بودن مسیر توکنی‌شده مجاز هستند.
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

## چرخه عمر و ذخیره‌سازی مصنوعات

- مصنوعات زیر زیرپوشه موقت ذخیره می‌شوند: `$TMPDIR/openclaw-diffs`.
- فراداده مصنوع مشاهده‌گر شامل این موارد است:
  - شناسه مصنوع تصادفی (20 نویسه hex)
  - توکن تصادفی (48 نویسه hex)
  - `createdAt` و `expiresAt`
  - مسیر ذخیره‌شده `viewer.html`
- وقتی مشخص نشده باشد، TTL پیش‌فرض مصنوع 30 دقیقه است.
- حداکثر TTL پذیرفته‌شده برای مشاهده‌گر 6 ساعت است.
- پاک‌سازی پس از ایجاد مصنوع به‌صورت فرصت‌طلبانه اجرا می‌شود.
- مصنوعات منقضی‌شده حذف می‌شوند.
- پاک‌سازی جایگزین، وقتی فراداده وجود ندارد، پوشه‌های کهنه‌تر از 24 ساعت را حذف می‌کند.

## رفتار URL مشاهده‌گر و شبکه

مسیر مشاهده‌گر:

- `/plugins/diffs/view/{artifactId}/{token}`

دارایی‌های مشاهده‌گر:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

سند مشاهده‌گر این دارایی‌ها را نسبت به URL مشاهده‌گر resolve می‌کند، بنابراین پیشوند مسیر اختیاری `baseUrl` برای درخواست‌های دارایی نیز حفظ می‌شود.

رفتار ساخت URL:

- اگر `baseUrl` فراخوانی ابزار ارائه شده باشد، پس از اعتبارسنجی سخت‌گیرانه استفاده می‌شود.
- در غیر این صورت، اگر `viewerBaseUrl` مربوط به Plugin پیکربندی شده باشد، از آن استفاده می‌شود.
- بدون هیچ‌کدام از بازنویسی‌ها، URL مشاهده‌گر به‌طور پیش‌فرض روی loopback یعنی `127.0.0.1` قرار می‌گیرد.
- اگر حالت bind در Gateway برابر `custom` باشد و `gateway.customBindHost` تنظیم شده باشد، از آن میزبان استفاده می‌شود.

قوانین `baseUrl`:

- باید `http://` یا `https://` باشد.
- Query و hash رد می‌شوند.
- Origin به‌همراه مسیر پایه اختیاری مجاز است.

## مدل امنیتی

<AccordionGroup>
  <Accordion title="مقاوم‌سازی نمایشگر">
    - به‌صورت پیش‌فرض فقط loopback.
    - مسیرهای نمایشگر دارای توکن با اعتبارسنجی سخت‌گیرانه شناسه و توکن.
    - CSP پاسخ نمایشگر:
      - `default-src 'none'`
      - اسکریپت‌ها و دارایی‌ها فقط از خود منبع
      - بدون `connect-src` خروجی
    - محدودسازی miss راه‌دور هنگام فعال بودن دسترسی راه‌دور:
      - 40 شکست در هر 60 ثانیه
      - قفل 60 ثانیه‌ای (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="مقاوم‌سازی رندر فایل">
    - مسیریابی درخواست مرورگر اسکرین‌شات به‌صورت پیش‌فرض انکار می‌شود.
    - فقط دارایی‌های محلی نمایشگر از `http://127.0.0.1/plugins/diffs/assets/*` مجاز هستند.
    - درخواست‌های شبکه خارجی مسدود می‌شوند.

  </Accordion>
</AccordionGroup>

## الزامات مرورگر برای حالت فایل

`mode: "file"` و `mode: "both"` به مرورگر سازگار با Chromium نیاز دارند.

ترتیب حل:

<Steps>
  <Step title="پیکربندی">
    `browser.executablePath` در پیکربندی OpenClaw.
  </Step>
  <Step title="متغیرهای محیطی">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="fallback پلتفرم">
    fallback کشف دستور/مسیر پلتفرم.
  </Step>
</Steps>

متن خطای رایج:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

با نصب Chrome، Chromium، Edge، یا Brave، یا تنظیم یکی از گزینه‌های مسیر اجرایی بالا آن را برطرف کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="خطاهای اعتبارسنجی ورودی">
    - `Provide patch or both before and after text.` — هم `before` و هم `after` را وارد کنید، یا `patch` ارائه دهید.
    - `Provide either patch or before/after input, not both.` — حالت‌های ورودی را ترکیب نکنید.
    - `Invalid baseUrl: ...` — از origin نوع `http(s)` با مسیر اختیاری و بدون query/hash استفاده کنید.
    - `{field} exceeds maximum size (...)` — اندازه payload را کاهش دهید.
    - رد شدن patch بزرگ — تعداد فایل‌های patch یا کل خطوط را کاهش دهید.

  </Accordion>
  <Accordion title="دسترس‌پذیری نمایشگر">
    - URL نمایشگر به‌صورت پیش‌فرض به `127.0.0.1` resolve می‌شود.
    - برای سناریوهای دسترسی راه‌دور، یکی از این کارها را انجام دهید:
      - `viewerBaseUrl` مربوط به plugin را تنظیم کنید، یا
      - در هر فراخوانی ابزار `baseUrl` را ارسال کنید، یا
      - از `gateway.bind=custom` و `gateway.customBindHost` استفاده کنید
    - اگر `gateway.trustedProxies` شامل loopback برای یک proxy هم‌میزبان باشد (برای مثال Tailscale Serve)، درخواست‌های خام نمایشگر از loopback بدون هدرهای client-IP فورواردشده طبق طراحی fail closed می‌شوند.
    - برای آن توپولوژی proxy:
      - وقتی فقط به یک پیوست نیاز دارید، `mode: "file"` یا `mode: "both"` را ترجیح دهید، یا
      - وقتی به URL قابل‌اشتراک‌گذاری نمایشگر نیاز دارید، عمدا `security.allowRemoteViewer` را فعال کنید و `viewerBaseUrl` مربوط به plugin را تنظیم کنید یا یک `baseUrl` از نوع proxy/عمومی ارسال کنید
    - `security.allowRemoteViewer` را فقط زمانی فعال کنید که قصد دسترسی خارجی به نمایشگر را دارید.

  </Accordion>
  <Accordion title="ردیف خطوط تغییریافته‌نشده دکمه بازکردن ندارد">
    این حالت می‌تواند برای ورودی patch زمانی رخ دهد که patch زمینه قابل بازکردن همراه نداشته باشد. این مورد مورد انتظار است و نشان‌دهنده شکست نمایشگر نیست.
  </Accordion>
  <Accordion title="artifact پیدا نشد">
    - artifact به‌دلیل TTL منقضی شده است.
    - توکن یا مسیر تغییر کرده است.
    - پاک‌سازی داده‌های کهنه را حذف کرده است.

  </Accordion>
</AccordionGroup>

## راهنمای عملیاتی

- برای بازبینی‌های تعاملی محلی در canvas، `mode: "view"` را ترجیح دهید.
- برای کانال‌های چت خروجی که به پیوست نیاز دارند، `mode: "file"` را ترجیح دهید.
- `allowRemoteViewer` را غیرفعال نگه دارید مگر اینکه استقرار شما به URLهای نمایشگر راه‌دور نیاز داشته باشد.
- برای diffهای حساس، `ttlSeconds` کوتاه و صریح تنظیم کنید.
- وقتی لازم نیست، از ارسال secrets در ورودی diff خودداری کنید.
- اگر کانال شما تصاویر را شدیدا فشرده می‌کند (برای مثال Telegram یا WhatsApp)، خروجی PDF (`fileFormat: "pdf"`) را ترجیح دهید.

<Note>
موتور رندر diff با [Diffs](https://diffs.com) قدرت می‌گیرد.
</Note>

## مرتبط

- [مرورگر](/fa/tools/browser)
- [Pluginها](/fa/tools/plugin)
- [نمای کلی ابزارها](/fa/tools)
