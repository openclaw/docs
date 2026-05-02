---
read_when:
    - می‌خواهید عامل‌ها ویرایش‌های کد یا مارک‌داون را به‌صورت نمایش تفاوت‌ها نشان دهند
    - یک URL نمایشگر آماده برای canvas یا یک فایل diff رندرشده می‌خواهید
    - شما به آرتیفکت‌های موقت و کنترل‌شدهٔ تفاوت‌ها با پیش‌فرض‌های امن نیاز دارید
sidebarTitle: Diffs
summary: نمایشگر تفاوت‌ها و رندرکنندهٔ فایل به‌صورت فقط‌خواندنی برای عامل‌ها (ابزار اختیاری Plugin)
title: تفاوت‌ها
x-i18n:
    generated_at: "2026-05-02T12:04:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 935f19ce45ff9a91d2c87c70603ce39b0f27f3fe58e52d809f25000a0c1ae82f
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` یک ابزار اختیاری Plugin با راهنمایی کوتاه داخلی در system و یک skill همراه است که محتوای تغییرات را به یک artifact فقط‌خواندنی diff برای agentها تبدیل می‌کند.

این ابزار یکی از این موارد را می‌پذیرد:

- متن `before` و `after`
- یک `patch` یکپارچه

می‌تواند این موارد را برگرداند:

- یک URL نمایشگر Gateway برای ارائه در canvas
- یک مسیر فایل رندرشده (PNG یا PDF) برای تحویل پیام
- هر دو خروجی در یک فراخوانی

وقتی فعال باشد، Plugin راهنمایی کاربردی مختصر را به فضای system-prompt اضافه می‌کند و همچنین برای مواردی که agent به دستورالعمل‌های کامل‌تر نیاز دارد، یک skill تفصیلی ارائه می‌دهد.

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
        جریان‌های canvas-first: agentها `diffs` را با `mode: "view"` فراخوانی می‌کنند و `details.viewerUrl` را با `canvas present` باز می‌کنند.
      </Tab>
      <Tab title="file">
        تحویل فایل در گفتگو: agentها `diffs` را با `mode: "file"` فراخوانی می‌کنند و `details.filePath` را با `message` و با استفاده از `path` یا `filePath` ارسال می‌کنند.
      </Tab>
      <Tab title="both">
        ترکیبی: agentها `diffs` را با `mode: "both"` فراخوانی می‌کنند تا هر دو artifact را در یک فراخوانی دریافت کنند.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## غیرفعال‌سازی راهنمایی داخلی system

اگر می‌خواهید ابزار `diffs` فعال بماند اما راهنمایی داخلی system-prompt آن غیرفعال شود، `plugins.entries.diffs.hooks.allowPromptInjection` را روی `false` تنظیم کنید:

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

این کار hook با نام `before_prompt_build` در Pluginِ diffs را مسدود می‌کند، در حالی که Plugin، ابزار و skill همراه همچنان در دسترس می‌مانند.

اگر می‌خواهید هم راهنمایی و هم ابزار را غیرفعال کنید، خود Plugin را غیرفعال کنید.

## گردش‌کار معمول agent

<Steps>
  <Step title="فراخوانی diffs">
    agent ابزار `diffs` را با ورودی فراخوانی می‌کند.
  </Step>
  <Step title="خواندن details">
    agent فیلدهای `details` را از پاسخ می‌خواند.
  </Step>
  <Step title="ارائه">
    agent یا `details.viewerUrl` را با `canvas present` باز می‌کند، یا `details.filePath` را با `message` و با استفاده از `path` یا `filePath` ارسال می‌کند، یا هر دو کار را انجام می‌دهد.
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

همه فیلدها اختیاری هستند، مگر اینکه ذکر شده باشد.

<ParamField path="before" type="string">
  متن اصلی. وقتی `patch` حذف شده باشد، همراه با `after` الزامی است.
</ParamField>
<ParamField path="after" type="string">
  متن به‌روزشده. وقتی `patch` حذف شده باشد، همراه با `before` الزامی است.
</ParamField>
<ParamField path="patch" type="string">
  متن diff یکپارچه. با `before` و `after` ناسازگار و متقابلاً انحصاری است.
</ParamField>
<ParamField path="path" type="string">
  نام فایل نمایشی برای حالت قبل و بعد.
</ParamField>
<ParamField path="lang" type="string">
  راهنمای بازنویسی زبان برای حالت قبل و بعد. مقدارهای ناشناخته به متن ساده برمی‌گردند.
</ParamField>
<ParamField path="title" type="string">
  بازنویسی عنوان نمایشگر.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  حالت خروجی. مقدار پیش‌فرض برابر با پیش‌فرض Plugin یعنی `defaults.mode` است. نام مستعار منسوخ: `"image"` مانند `"file"` رفتار می‌کند و همچنان برای سازگاری با نسخه‌های قبلی پذیرفته می‌شود.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  پوسته نمایشگر. مقدار پیش‌فرض برابر با پیش‌فرض Plugin یعنی `defaults.theme` است.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  چیدمان diff. مقدار پیش‌فرض برابر با پیش‌فرض Plugin یعنی `defaults.layout` است.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  وقتی زمینه کامل در دسترس باشد، بخش‌های بدون تغییر را باز می‌کند. فقط گزینه‌ای برای هر فراخوانی است (کلید پیش‌فرض Plugin نیست).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  قالب فایل رندرشده. مقدار پیش‌فرض برابر با پیش‌فرض Plugin یعنی `defaults.fileFormat` است.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  preset کیفیت برای رندر PNG یا PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  بازنویسی مقیاس دستگاه (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  بیشینه عرض رندر بر حسب پیکسل CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL artifact بر حسب ثانیه برای خروجی‌های نمایشگر و فایل مستقل. حداکثر 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  بازنویسی origin برای URL نمایشگر. مقدار `viewerBaseUrl` در Plugin را بازنویسی می‌کند. باید `http` یا `https` باشد، بدون query/hash.
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
    - سقف پیچیدگی patch: حداکثر 128 فایل و در مجموع 120000 خط.
    - استفاده همزمان از `patch` و `before` یا `after` رد می‌شود.
    - محدودیت‌های ایمنی فایل رندرشده (برای PNG و PDF اعمال می‌شود):
      - `fileQuality: "standard"`: حداکثر 8 MP (8,000,000 پیکسل رندرشده).
      - `fileQuality: "hq"`: حداکثر 14 MP (14,000,000 پیکسل رندرشده).
      - `fileQuality: "print"`: حداکثر 24 MP (24,000,000 پیکسل رندرشده).
      - PDF همچنین حداکثر 50 صفحه دارد.

  </Accordion>
</AccordionGroup>

## قرارداد جزئیات خروجی

ابزار metadata ساخت‌یافته را زیر `details` برمی‌گرداند.

<AccordionGroup>
  <Accordion title="فیلدهای نمایشگر">
    فیلدهای مشترک برای حالت‌هایی که نمایشگر می‌سازند:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`، `sessionId`، `messageChannel`، `agentAccountId` وقتی در دسترس باشد)

  </Accordion>
  <Accordion title="فیلدهای فایل">
    فیلدهای فایل وقتی PNG یا PDF رندر می‌شود:

    - `artifactId`
    - `expiresAt`
    - `filePath`
    - `path` (همان مقدار `filePath`، برای سازگاری با ابزار message)
    - `fileBytes`
    - `fileFormat`
    - `fileQuality`
    - `fileScale`
    - `fileMaxWidth`

  </Accordion>
  <Accordion title="نام‌های مستعار سازگاری">
    برای فراخوان‌های موجود نیز برگردانده می‌شود:

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
| `"view"` | فقط فیلدهای نمایشگر.                                                                                                    |
| `"file"` | فقط فیلدهای فایل، بدون artifact نمایشگر.                                                                                  |
| `"both"` | فیلدهای نمایشگر به‌همراه فیلدهای فایل. اگر رندر فایل شکست بخورد، نمایشگر همچنان با `fileError` و نام مستعار `imageError` برمی‌گردد. |

## بخش‌های بدون تغییر جمع‌شده

- نمایشگر می‌تواند ردیف‌هایی مانند `N unmodified lines` نشان دهد.
- کنترل‌های باز کردن روی آن ردیف‌ها شرطی هستند و برای هر نوع ورودی تضمین نمی‌شوند.
- کنترل‌های باز کردن زمانی ظاهر می‌شوند که diff رندرشده داده زمینه قابل باز شدن داشته باشد، که برای ورودی قبل و بعد معمول است.
- برای بسیاری از ورودی‌های patch یکپارچه، بدنه‌های زمینه حذف‌شده در hunkهای patch تجزیه‌شده در دسترس نیستند، بنابراین ردیف می‌تواند بدون کنترل‌های باز کردن ظاهر شود. این رفتار مورد انتظار است.
- `expandUnchanged` فقط وقتی اعمال می‌شود که زمینه قابل باز شدن وجود داشته باشد.

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

### پیکربندی URL نمایشگر پایدار

<ParamField path="viewerBaseUrl" type="string">
  fallback متعلق به Plugin برای لینک‌های نمایشگر برگشتی وقتی فراخوانی ابزار `baseUrl` را پاس نمی‌دهد. باید `http` یا `https` باشد، بدون query/hash.
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
  `false`: درخواست‌های غیر loopback به routeهای نمایشگر رد می‌شوند. `true`: اگر مسیر tokenized معتبر باشد، نمایشگرهای remote مجاز هستند.
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

## چرخه عمر و ذخیره‌سازی artifact

- artifactها زیر زیرپوشه موقت ذخیره می‌شوند: `$TMPDIR/openclaw-diffs`.
- metadata مربوط به artifact نمایشگر شامل این موارد است:
  - شناسه artifact تصادفی (20 کاراکتر hex)
  - token تصادفی (48 کاراکتر hex)
  - `createdAt` و `expiresAt`
  - مسیر ذخیره‌شده `viewer.html`
- وقتی مشخص نشده باشد، TTL پیش‌فرض artifact برابر با 30 دقیقه است.
- بیشینه TTL پذیرفته‌شده برای نمایشگر 6 ساعت است.
- پاک‌سازی پس از ایجاد artifact به‌صورت فرصت‌طلبانه اجرا می‌شود.
- artifactهای منقضی‌شده حذف می‌شوند.
- پاک‌سازی fallback وقتی metadata موجود نباشد، پوشه‌های کهنه‌تر از 24 ساعت را حذف می‌کند.

## URL نمایشگر و رفتار شبکه

route نمایشگر:

- `/plugins/diffs/view/{artifactId}/{token}`

assetهای نمایشگر:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`

سند نمایشگر این assetها را نسبت به URL نمایشگر resolve می‌کند، بنابراین پیشوند مسیر اختیاری `baseUrl` برای درخواست‌های asset نیز حفظ می‌شود.

رفتار ساخت URL:

- اگر `baseUrl` در فراخوانی ابزار ارائه شده باشد، پس از اعتبارسنجی سخت‌گیرانه استفاده می‌شود.
- در غیر این صورت، اگر `viewerBaseUrl` در Plugin پیکربندی شده باشد، از آن استفاده می‌شود.
- بدون هیچ‌یک از بازنویسی‌ها، URL نمایشگر به‌صورت پیش‌فرض به loopback `127.0.0.1` تنظیم می‌شود.
- اگر حالت bind در Gateway برابر `custom` باشد و `gateway.customBindHost` تنظیم شده باشد، از آن host استفاده می‌شود.

قواعد `baseUrl`:

- باید `http://` یا `https://` باشد.
- query و hash رد می‌شوند.
- origin به‌همراه مسیر پایه اختیاری مجاز است.

## مدل امنیتی

<AccordionGroup>
  <Accordion title="سخت‌سازی نمایشگر">
    - به‌طور پیش‌فرض فقط local loopback.
    - مسیرهای نمایشگر دارای توکن، با اعتبارسنجی سخت‌گیرانه شناسه و توکن.
    - CSP پاسخ نمایشگر:
      - `default-src 'none'`
      - اسکریپت‌ها و دارایی‌ها فقط از خود منبع
      - بدون `connect-src` خروجی
    - محدودسازی خطاهای راه دور هنگام فعال بودن دسترسی راه دور:
      - 40 خطا در هر 60 ثانیه
      - قفل‌شدن 60 ثانیه‌ای (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="سخت‌سازی رندر فایل">
    - مسیریابی درخواست‌های مرورگر اسکرین‌شات به‌صورت پیش‌فرض deny-by-default است.
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

برای رفع، Chrome، Chromium، Edge یا Brave را نصب کنید، یا یکی از گزینه‌های مسیر فایل اجرایی بالا را تنظیم کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="خطاهای اعتبارسنجی ورودی">
    - `Provide patch or both before and after text.` — هم `before` و هم `after` را وارد کنید، یا `patch` ارائه دهید.
    - `Provide either patch or before/after input, not both.` — حالت‌های ورودی را با هم ترکیب نکنید.
    - `Invalid baseUrl: ...` — از مبدأ `http(s)` با مسیر اختیاری استفاده کنید، بدون query/hash.
    - `{field} exceeds maximum size (...)` — اندازه payload را کاهش دهید.
    - رد شدن patch بزرگ — تعداد فایل‌های patch یا مجموع خطوط را کاهش دهید.

  </Accordion>
  <Accordion title="دسترس‌پذیری نمایشگر">
    - URL نمایشگر به‌طور پیش‌فرض به `127.0.0.1` resolve می‌شود.
    - برای سناریوهای دسترسی راه دور، یکی از این کارها را انجام دهید:
      - `viewerBaseUrl` مربوط به Plugin را تنظیم کنید، یا
      - در هر فراخوانی ابزار `baseUrl` را ارسال کنید، یا
      - از `gateway.bind=custom` و `gateway.customBindHost` استفاده کنید
    - اگر `gateway.trustedProxies` شامل loopback برای یک پروکسی همان میزبان باشد (برای مثال Tailscale Serve)، درخواست‌های خام نمایشگر از loopback بدون هدرهای client-IP فورواردشده، طبق طراحی fail closed می‌شوند.
    - برای آن توپولوژی پروکسی:
      - وقتی فقط به یک پیوست نیاز دارید، `mode: "file"` یا `mode: "both"` را ترجیح دهید، یا
      - وقتی به URL نمایشگر قابل اشتراک‌گذاری نیاز دارید، عمداً `security.allowRemoteViewer` را فعال کنید و `viewerBaseUrl` مربوط به Plugin را تنظیم کنید یا یک `baseUrl` پروکسی/عمومی ارسال کنید
    - `security.allowRemoteViewer` را فقط زمانی فعال کنید که قصد دسترسی خارجی به نمایشگر را دارید.

  </Accordion>
  <Accordion title="ردیف خطوط تغییرنکرده دکمه باز کردن ندارد">
    این وضعیت می‌تواند برای ورودی patch رخ دهد، وقتی patch زمینه قابل گسترش همراه ندارد. این مورد مورد انتظار است و نشان‌دهنده خرابی نمایشگر نیست.
  </Accordion>
  <Accordion title="Artifact پیدا نشد">
    - Artifact به دلیل TTL منقضی شده است.
    - توکن یا مسیر تغییر کرده است.
    - پاک‌سازی داده‌های کهنه را حذف کرده است.

  </Accordion>
</AccordionGroup>

## راهنمای عملیاتی

- برای بازبینی‌های تعاملی محلی در canvas، `mode: "view"` را ترجیح دهید.
- برای کانال‌های گفت‌وگوی خروجی که به پیوست نیاز دارند، `mode: "file"` را ترجیح دهید.
- `allowRemoteViewer` را غیرفعال نگه دارید، مگر اینکه deployment شما به URLهای نمایشگر راه دور نیاز داشته باشد.
- برای diffهای حساس، `ttlSeconds` کوتاه و صریح تنظیم کنید.
- وقتی لازم نیست، از ارسال اسرار در ورودی diff خودداری کنید.
- اگر کانال شما تصاویر را شدیداً فشرده می‌کند (برای مثال Telegram یا WhatsApp)، خروجی PDF (`fileFormat: "pdf"`) را ترجیح دهید.

<Note>
موتور رندر diff با [Diffs](https://diffs.com) پشتیبانی می‌شود.
</Note>

## مرتبط

- [مرورگر](/fa/tools/browser)
- [Plugins](/fa/tools/plugin)
- [نمای کلی ابزارها](/fa/tools)
