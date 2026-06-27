---
read_when:
    - می‌خواهید عامل‌ها ویرایش‌های کد یا Markdown را به‌صورت diff نشان دهند
    - یک URL آماده برای نمایش در canvas یا یک فایل diff رندرشده می‌خواهید
    - به آرتیفکت‌های diff موقت و کنترل‌شده با پیش‌فرض‌های امن نیاز دارید
sidebarTitle: Diffs
summary: نمایشگر تفاوت و رندرکننده فایل فقط‌خواندنی برای عامل‌ها (ابزار Plugin اختیاری)
title: تفاوت‌ها
x-i18n:
    generated_at: "2026-06-27T18:56:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea3d8e9e026e10b2f3658b795c07ea21062896ab0d45a8cb2dc7e0e9ed9aa658
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` یک ابزار اختیاری Plugin با راهنمای سیستم داخلی کوتاه و یک Skill همراه است که محتوای تغییرات را به یک مصنوع diff فقط‌خواندنی برای عامل‌ها تبدیل می‌کند.

یا این‌ها را می‌پذیرد:

- متن `before` و `after`
- یک `patch` یکپارچه

می‌تواند این‌ها را برگرداند:

- یک URL نمایشگر Gateway برای ارائه روی canvas
- یک مسیر فایل رندرشده (PNG یا PDF) برای تحویل پیام
- هر دو خروجی در یک فراخوانی

وقتی فعال باشد، Plugin راهنمای کاربردی مختصر را به فضای system-prompt اضافه می‌کند و همچنین برای مواردی که عامل به دستورالعمل‌های کامل‌تر نیاز دارد، یک Skill تفصیلی ارائه می‌دهد.

## شروع سریع

<Steps>
  <Step title="Install the plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
  <Step title="Enable the plugin">
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
  <Step title="Pick a mode">
    <Tabs>
      <Tab title="view">
        جریان‌های canvas-محور: عامل‌ها `diffs` را با `mode: "view"` فراخوانی می‌کنند و `details.viewerUrl` را با `canvas present` باز می‌کنند.
      </Tab>
      <Tab title="file">
        تحویل فایل در چت: عامل‌ها `diffs` را با `mode: "file"` فراخوانی می‌کنند و `details.filePath` را با `message` با استفاده از `path` یا `filePath` ارسال می‌کنند.
      </Tab>
      <Tab title="both">
        ترکیبی: عامل‌ها `diffs` را با `mode: "both"` فراخوانی می‌کنند تا هر دو مصنوع را در یک فراخوانی دریافت کنند.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## غیرفعال‌کردن راهنمای سیستم داخلی

اگر می‌خواهید ابزار `diffs` فعال بماند اما راهنمای system-prompt داخلی آن را غیرفعال کنید، `plugins.entries.diffs.hooks.allowPromptInjection` را روی `false` تنظیم کنید:

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

این کار hookِ `before_prompt_build` مربوط به Plugin `diffs` را مسدود می‌کند، در حالی که خود Plugin، ابزار و Skill همراه همچنان در دسترس می‌مانند.

اگر می‌خواهید هم راهنما و هم ابزار را غیرفعال کنید، به‌جای آن Plugin را غیرفعال کنید.

## گردش‌کار معمول عامل

<Steps>
  <Step title="Call diffs">
    عامل ابزار `diffs` را با ورودی فراخوانی می‌کند.
  </Step>
  <Step title="Read details">
    عامل فیلدهای `details` را از پاسخ می‌خواند.
  </Step>
  <Step title="Present">
    عامل یا `details.viewerUrl` را با `canvas present` باز می‌کند، یا `details.filePath` را با `message` با استفاده از `path` یا `filePath` ارسال می‌کند، یا هر دو کار را انجام می‌دهد.
  </Step>
</Steps>

## نمونه‌های ورودی

<Tabs>
  <Tab title="Before and after">
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

همه فیلدها اختیاری‌اند، مگر خلاف آن ذکر شده باشد.

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
  راهنمای بازنویسی زبان برای حالت قبل و بعد. مقدارهای ناشناخته و زبان‌های خارج از مجموعه پیش‌فرض نمایشگر، به متن ساده برمی‌گردند مگر اینکه
  Plugin Diff Viewer Language Pack نصب شده باشد.
</ParamField>

<ParamField path="title" type="string">
  بازنویسی عنوان نمایشگر.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  حالت خروجی. مقدار پیش‌فرض آن پیش‌فرض Plugin یعنی `defaults.mode` است. نام مستعار منسوخ: `"image"` مانند `"file"` رفتار می‌کند و هنوز برای سازگاری عقب‌رو پذیرفته می‌شود.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  تم نمایشگر. مقدار پیش‌فرض آن پیش‌فرض Plugin یعنی `defaults.theme` است.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  چیدمان diff. مقدار پیش‌فرض آن پیش‌فرض Plugin یعنی `defaults.layout` است.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  وقتی زمینه کامل در دسترس باشد، بخش‌های بدون تغییر را گسترش می‌دهد. فقط گزینه هر فراخوانی است (کلید پیش‌فرض Plugin نیست).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  قالب فایل رندرشده. مقدار پیش‌فرض آن پیش‌فرض Plugin یعنی `defaults.fileFormat` است.
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
  TTL مصنوع بر حسب ثانیه برای خروجی‌های نمایشگر و فایل مستقل. حداکثر 21600.
</ParamField>
<ParamField path="baseUrl" type="string">
  بازنویسی مبدا URL نمایشگر. `viewerBaseUrl` مربوط به Plugin را بازنویسی می‌کند. باید `http` یا `https` باشد، بدون query/hash.
</ParamField>

<AccordionGroup>
  <Accordion title="Legacy input aliases">
    همچنان برای سازگاری عقب‌رو پذیرفته می‌شوند:

    - `format` -> `fileFormat`
    - `imageFormat` -> `fileFormat`
    - `imageQuality` -> `fileQuality`
    - `imageScale` -> `fileScale`
    - `imageMaxWidth` -> `fileMaxWidth`

  </Accordion>
  <Accordion title="Validation and limits">
    - `before` و `after` هرکدام حداکثر 512 KiB.
    - `patch` حداکثر 2 MiB.
    - `path` حداکثر 2048 بایت.
    - `lang` حداکثر 128 بایت.
    - `title` حداکثر 1024 بایت.
    - سقف پیچیدگی patch: حداکثر 128 فایل و 120000 خط در مجموع.
    - ترکیب `patch` با `before` یا `after` رد می‌شود.
    - محدودیت‌های ایمنی فایل رندرشده (برای PNG و PDF اعمال می‌شود):
      - `fileQuality: "standard"`: حداکثر 8 MP (8,000,000 پیکسل رندرشده).
      - `fileQuality: "hq"`: حداکثر 14 MP (14,000,000 پیکسل رندرشده).
      - `fileQuality: "print"`: حداکثر 24 MP (24,000,000 پیکسل رندرشده).
      - PDF همچنین حداکثر 50 صفحه دارد.

  </Accordion>
</AccordionGroup>

## برجسته‌سازی نحو

OpenClaw شامل برجسته‌سازی نحو برای زبان‌های رایج سورس، پیکربندی و مستندات است:

`javascript`, `typescript`, `tsx`, `jsx`, `json`, `markdown`, `yaml`, `css`, `html`, `sh`, `python`, `go`, `rust`, `java`, `c`, `cpp`, `csharp`, `php`, `sql`, `docker`, `ruby`, `swift`, `kotlin`, `r`, `dart`, `lua`, `powershell`, `xml`, و `toml`.

نام‌های مستعار رایجی مانند `js`, `ts`, `bash`, `md`, `yml`, `c++`, `dockerfile`, `rb`, `kt`, و `ps1` به آن زبان‌های پیش‌فرض نرمال‌سازی می‌شوند.

Plugin بسته زبانی Diff Viewer را نصب کنید تا زبان‌های دیگر برجسته‌سازی شوند:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

با در دسترس بودن بسته زبانی، OpenClaw می‌تواند زبان‌های بسیار بیشتری را برجسته‌سازی کند. اگر بسته نصب نشده باشد، فایل‌های خارج از فهرست پیش‌فرض همچنان به‌صورت متن ساده و خوانا رندر می‌شوند. نمونه‌ها شامل Astro، Vue، Svelte، MDX، GraphQL، Terraform/HCL، Nix، Clojure، Elixir، Haskell، OCaml، Scala، Zig، Solidity، Verilog/VHDL، Fortran، MATLAB، LaTeX، Mermaid، Sass/Less/SCSS، Nginx، Apache، CSV، dotenv، INI و فایل‌های diff هستند.

برای جزئیات، [Plugin بسته زبانی Diffs](/fa/plugins/reference/diffs-language-pack) و برای کاتالوگ زبان‌ها و نام‌های مستعار بالادستی Shiki، [زبان‌های Shiki](https://shiki.style/languages) را ببینید.

## قرارداد جزئیات خروجی

این ابزار فراداده ساختاریافته را زیر `details` برمی‌گرداند.

<AccordionGroup>
  <Accordion title="Viewer fields">
    فیلدهای مشترک برای حالت‌هایی که یک نمایشگر ایجاد می‌کنند:

    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`، `sessionId`، `messageChannel`، `agentAccountId` در صورت در دسترس بودن)

  </Accordion>
  <Accordion title="File fields">
    فیلدهای فایل هنگامی که PNG یا PDF رندر می‌شود:

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
  <Accordion title="Compatibility aliases">
    همچنین برای فراخواننده‌های موجود برگردانده می‌شود:

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
| `"file"` | فقط فیلدهای فایل، بدون آرتیفکت نمایشگر.                                                                                  |
| `"both"` | فیلدهای نمایشگر به‌همراه فیلدهای فایل. اگر رندر فایل ناموفق باشد، نمایشگر همچنان با `fileError` و نام مستعار `imageError` برمی‌گردد. |

## بخش‌های بدون تغییر جمع‌شده

- نمایشگر می‌تواند ردیف‌هایی مانند `N unmodified lines` را نشان دهد.
- کنترل‌های باز کردن روی آن ردیف‌ها شرطی هستند و برای هر نوع ورودی تضمین نمی‌شوند.
- کنترل‌های باز کردن زمانی ظاهر می‌شوند که diff رندرشده داده زمینه قابل گسترش داشته باشد؛ این حالت برای ورودی‌های قبل و بعد معمول است.
- برای بسیاری از ورودی‌های وصله یکپارچه، بدنه‌های زمینه حذف‌شده در hunkهای وصله تجزیه‌شده در دسترس نیستند، بنابراین ردیف می‌تواند بدون کنترل‌های باز کردن ظاهر شود. این رفتار مورد انتظار است.
- `expandUnchanged` فقط زمانی اعمال می‌شود که زمینه قابل گسترش وجود داشته باشد.

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

### پیکربندی URL پایدار نمایشگر

<ParamField path="viewerBaseUrl" type="string">
  fallback تحت مالکیت Plugin برای لینک‌های نمایشگر برگشتی، زمانی که فراخوانی ابزار `baseUrl` را ارسال نمی‌کند. باید `http` یا `https` باشد، بدون query/hash.
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

## پیکربندی امنیتی

<ParamField path="security.allowRemoteViewer" type="boolean" default="false">
  `false`: درخواست‌های غیر-loopback به مسیرهای نمایشگر رد می‌شوند. `true`: اگر مسیر توکن‌دار معتبر باشد، نمایشگرهای راه‌دور مجاز هستند.
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

- آرتیفکت‌ها در زیرپوشه موقت ذخیره می‌شوند: `$TMPDIR/openclaw-diffs`.
- فراداده آرتیفکت نمایشگر شامل موارد زیر است:
  - شناسه تصادفی آرتیفکت (۲۰ نویسه hex)
  - توکن تصادفی (۴۸ نویسه hex)
  - `createdAt` و `expiresAt`
  - مسیر ذخیره‌شده `viewer.html`
- TTL پیش‌فرض آرتیفکت، وقتی مشخص نشده باشد، ۳۰ دقیقه است.
- بیشترین TTL پذیرفته‌شده برای نمایشگر ۶ ساعت است.
- پاک‌سازی پس از ایجاد آرتیفکت به‌صورت فرصت‌طلبانه اجرا می‌شود.
- آرتیفکت‌های منقضی‌شده حذف می‌شوند.
- پاک‌سازی جایگزین، وقتی فراداده وجود ندارد، پوشه‌های کهنه‌تر از ۲۴ ساعت را حذف می‌کند.

## URL نمایشگر و رفتار شبکه

مسیر نمایشگر:

- `/plugins/diffs/view/{artifactId}/{token}`

دارایی‌های نمایشگر:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` وقتی diff از زبانی در Diff Viewer Language Pack استفاده می‌کند

سند نمایشگر این دارایی‌ها را نسبت به URL نمایشگر resolve می‌کند، بنابراین پیشوند مسیر اختیاری `baseUrl` برای هر دو درخواست دارایی نیز حفظ می‌شود.

رفتار ساخت URL:

- اگر `baseUrl` فراخوانی ابزار ارائه شده باشد، پس از اعتبارسنجی سخت‌گیرانه استفاده می‌شود.
- در غیر این صورت، اگر `viewerBaseUrl` مربوط به Plugin پیکربندی شده باشد، استفاده می‌شود.
- بدون هیچ‌کدام از این overrideها، URL نمایشگر به‌صورت پیش‌فرض روی loopback یعنی `127.0.0.1` قرار می‌گیرد.
- اگر حالت bind مربوط به Gateway برابر `custom` باشد و `gateway.customBindHost` تنظیم شده باشد، از همان host استفاده می‌شود.

قواعد `baseUrl`:

- باید `http://` یا `https://` باشد.
- query و hash رد می‌شوند.
- origin به‌همراه مسیر پایه اختیاری مجاز است.

## مدل امنیتی

<AccordionGroup>
  <Accordion title="Viewer hardening">
    - به‌صورت پیش‌فرض فقط loopback.
    - مسیرهای نمایشگر توکن‌دار با اعتبارسنجی سخت‌گیرانه شناسه و توکن.
    - CSP پاسخ نمایشگر:
      - `default-src 'none'`
      - اسکریپت‌ها و دارایی‌ها فقط از self
      - بدون `connect-src` خروجی
    - محدودسازی miss راه دور وقتی دسترسی راه دور فعال است:
      - ۴۰ شکست در هر ۶۰ ثانیه
      - قفل ۶۰ ثانیه‌ای (`429 Too Many Requests`)

  </Accordion>
  <Accordion title="File rendering hardening">
    - مسیریابی درخواست مرورگر اسکرین‌شات به‌صورت پیش‌فرض deny است.
    - فقط دارایی‌های محلی نمایشگر از `http://127.0.0.1/plugins/diffs/assets/*` مجاز هستند.
    - درخواست‌های شبکه خارجی مسدود می‌شوند.

  </Accordion>
</AccordionGroup>

## نیازمندی‌های مرورگر برای حالت فایل

`mode: "file"` و `mode: "both"` به مرورگر سازگار با Chromium نیاز دارند.

ترتیب resolve:

<Steps>
  <Step title="Config">
    `browser.executablePath` در پیکربندی OpenClaw.
  </Step>
  <Step title="Environment variables">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="Platform fallback">
    fallback کشف فرمان/مسیر پلتفرم.
  </Step>
</Steps>

متن رایج خطا:

- `Diff PNG/PDF rendering requires a Chromium-compatible browser...`

برای رفع، Chrome، Chromium، Edge یا Brave را نصب کنید، یا یکی از گزینه‌های مسیر executable بالا را تنظیم کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="Input validation errors">
    - `Provide patch or both before and after text.` — هر دو `before` و `after` را وارد کنید، یا `patch` ارائه دهید.
    - `Provide either patch or before/after input, not both.` — حالت‌های ورودی را ترکیب نکنید.
    - `Invalid baseUrl: ...` — از origin نوع `http(s)` با مسیر اختیاری استفاده کنید، بدون query/hash.
    - `{field} exceeds maximum size (...)` — اندازه payload را کاهش دهید.
    - رد patch بزرگ — تعداد فایل‌های patch یا مجموع خطوط را کاهش دهید.

  </Accordion>
  <Accordion title="Viewer accessibility">
    - URL نمایشگر به‌صورت پیش‌فرض به `127.0.0.1` resolve می‌شود.
    - برای سناریوهای دسترسی راه دور، یکی از این کارها را انجام دهید:
      - `viewerBaseUrl` مربوط به Plugin را تنظیم کنید، یا
      - در هر فراخوانی ابزار `baseUrl` پاس دهید، یا
      - از `gateway.bind=custom` و `gateway.customBindHost` استفاده کنید
    - اگر `gateway.trustedProxies` برای یک پروکسی هم‌میزبان شامل loopback باشد (برای مثال Tailscale Serve)، درخواست‌های خام نمایشگر روی loopback بدون هدرهای client-IP فورواردشده طبق طراحی fail closed می‌شوند.
    - برای آن توپولوژی پروکسی:
      - وقتی فقط به یک پیوست نیاز دارید، `mode: "file"` یا `mode: "both"` را ترجیح دهید، یا
      - وقتی به URL نمایشگر قابل اشتراک‌گذاری نیاز دارید، عمداً `security.allowRemoteViewer` را فعال کنید و `viewerBaseUrl` مربوط به Plugin را تنظیم کنید یا یک `baseUrl` پروکسی/عمومی پاس دهید
    - `security.allowRemoteViewer` را فقط زمانی فعال کنید که قصد دسترسی خارجی به نمایشگر را دارید.

  </Accordion>
  <Accordion title="Unmodified-lines row has no expand button">
    این حالت برای ورودی patch می‌تواند زمانی رخ دهد که patch زمینه قابل گسترش همراه نداشته باشد. این مورد مورد انتظار است و نشان‌دهنده خرابی نمایشگر نیست.
  </Accordion>
  <Accordion title="Artifact not found">
    - آرتیفکت به‌دلیل TTL منقضی شده است.
    - توکن یا مسیر تغییر کرده است.
    - پاک‌سازی داده‌های کهنه را حذف کرده است.

  </Accordion>
</AccordionGroup>

## راهنمای عملیاتی

- برای بازبینی‌های تعاملی محلی در canvas، `mode: "view"` را ترجیح دهید.
- برای کانال‌های چت خروجی که به پیوست نیاز دارند، `mode: "file"` را ترجیح دهید.
- `allowRemoteViewer` را غیرفعال نگه دارید، مگر اینکه استقرار شما به URLهای نمایشگر راه دور نیاز داشته باشد.
- برای diffهای حساس، `ttlSeconds` کوتاه و صریح تنظیم کنید.
- وقتی لازم نیست، از ارسال secrets در ورودی diff خودداری کنید.
- اگر کانال شما تصاویر را به‌شدت فشرده می‌کند (برای مثال Telegram یا WhatsApp)، خروجی PDF را ترجیح دهید (`fileFormat: "pdf"`).

<Note>
موتور رندر diff با [Diffs](https://diffs.com) کار می‌کند.
</Note>

## مرتبط

- [مرورگر](/fa/tools/browser)
- [Pluginها](/fa/tools/plugin)
- [نمای کلی ابزارها](/fa/tools)
