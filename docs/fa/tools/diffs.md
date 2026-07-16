---
read_when:
    - می‌خواهید عامل‌ها ویرایش‌های کد یا Markdown را به‌صورت تفاوت‌ها نمایش دهند
    - یک URL نمایشگر آماده برای canvas یا یک فایل diff رندرشده می‌خواهید
    - به مصنوعات موقت و کنترل‌شدهٔ تفاوت‌ها با پیش‌فرض‌های امن نیاز دارید
sidebarTitle: Diffs
summary: نمایشگر تفاوت‌ها و رندرکنندهٔ فایل فقط‌خواندنی برای عامل‌ها (ابزار اختیاری Plugin)
title: تفاوت‌ها
x-i18n:
    generated_at: "2026-07-16T17:32:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f28a8ac4191f72376ba5c8823337bd337e3fac236ea4ecc2204e6dcf2930e607
    source_path: tools/diffs.md
    workflow: 16
---

`diffs` یک ابزار اختیاریِ همراهِ Plugin است که متن پیش/پس یا یک وصلهٔ یکپارچه را به یک مصنوع diff فقط‌خواندنی تبدیل می‌کند. همچنین راهنمایی کوتاهی برای عامل به ابتدای اعلان سیستم می‌افزاید و برای دستورالعمل‌های کامل‌تر، یک Skill همراه ارائه می‌دهد.

ورودی: متن `before` + `after`، یا یک `patch` یکپارچه (ناهم‌زمان و انحصاری).

خروجی: یک URL نمایشگر Gateway برای ارائه در بوم، مسیر فایل PNG/PDF رندرشده برای تحویل پیام، یا هر دو.

## شروع سریع

<Steps>
  <Step title="نصب Plugin">
    ```bash
    openclaw plugins install diffs
    ```
  </Step>
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
        جریان‌های بوم‌محور: عامل‌ها `diffs` را با `mode: "view"` فراخوانی می‌کنند و `details.viewerUrl` را با `canvas present` باز می‌کنند.
      </Tab>
      <Tab title="file">
        تحویل فایل در گپ: عامل‌ها `diffs` را با `mode: "file"` فراخوانی می‌کنند و `details.filePath` را با `message`، با استفاده از `path` یا `filePath` ارسال می‌کنند.
      </Tab>
      <Tab title="both">
        ترکیبی (پیش‌فرض): عامل‌ها `diffs` را با `mode: "both"` فراخوانی می‌کنند تا هر دو مصنوع را در یک فراخوانی دریافت کنند.
      </Tab>
    </Tabs>
  </Step>
</Steps>

## غیرفعال‌کردن راهنمای داخلی سیستم

برای نگه‌داشتن ابزار و حذف راهنمای افزوده‌شده به اعلان سیستم، `plugins.entries.diffs.hooks.allowPromptInjection` را روی `false` تنظیم کنید:

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

این کار قلاب `before_prompt_build` متعلق به Plugin را مسدود می‌کند، درحالی‌که ابزار و Skill همچنان در دسترس می‌مانند. برای غیرفعال‌کردن هم راهنما و هم ابزار، خود Plugin را غیرفعال کنید.

## مرجع ورودی ابزار

همهٔ فیلدها اختیاری‌اند، مگر آنکه خلافش ذکر شده باشد.

<ParamField path="before" type="string">
  متن اصلی. وقتی `patch` حذف شده است، همراه با `after` الزامی است.
</ParamField>
<ParamField path="after" type="string">
  متن به‌روزشده. وقتی `patch` حذف شده است، همراه با `before` الزامی است.
</ParamField>
<ParamField path="patch" type="string">
  متن diff یکپارچه. با `before` و `after` ناهم‌زمان و انحصاری است.
</ParamField>
<ParamField path="path" type="string">
  نام فایل نمایشی برای حالت پیش/پس.
</ParamField>
<ParamField path="lang" type="string">
  راهنمای بازنویسی زبان برای حالت پیش/پس. مقادیر ناشناخته و زبان‌های خارج از مجموعهٔ پیش‌فرض نمایشگر، مگر آنکه Plugin بستهٔ زبان نمایشگر Diff نصب شده باشد، به متن ساده برمی‌گردند.
</ParamField>
<ParamField path="title" type="string">
  بازنویسی عنوان نمایشگر.
</ParamField>
<ParamField path="mode" type='"view" | "file" | "both"'>
  حالت خروجی. پیش‌فرض آن مقدار پیش‌فرض Plugin یعنی `defaults.mode` (`both`) است. نام مستعار منسوخ‌شده: `"image"` دقیقاً مانند `"file"` رفتار می‌کند.
</ParamField>
<ParamField path="theme" type='"light" | "dark"'>
  پوستهٔ نمایشگر. پیش‌فرض آن مقدار پیش‌فرض Plugin یعنی `defaults.theme` است.
</ParamField>
<ParamField path="layout" type='"unified" | "split"'>
  چیدمان diff. پیش‌فرض آن مقدار پیش‌فرض Plugin یعنی `defaults.layout` است.
</ParamField>
<ParamField path="expandUnchanged" type="boolean">
  وقتی زمینهٔ کامل در دسترس است، بخش‌های بدون تغییر را گسترش می‌دهد. فقط گزینهٔ هر فراخوانی است (کلید پیش‌فرض Plugin نیست).
</ParamField>
<ParamField path="fileFormat" type='"png" | "pdf"'>
  قالب فایل رندرشده. پیش‌فرض آن مقدار پیش‌فرض Plugin یعنی `defaults.fileFormat` است.
</ParamField>
<ParamField path="fileQuality" type='"standard" | "hq" | "print"'>
  پیش‌تنظیم کیفیت برای رندر PNG/PDF.
</ParamField>
<ParamField path="fileScale" type="number">
  بازنویسی مقیاس دستگاه (`1`-`4`).
</ParamField>
<ParamField path="fileMaxWidth" type="number">
  حداکثر عرض رندر بر حسب پیکسل CSS (`640`-`2400`).
</ParamField>
<ParamField path="ttlSeconds" type="number" default="1800">
  TTL مصنوع بر حسب ثانیه برای خروجی‌های نمایشگر و فایل مستقل. حداکثر `21600`.
</ParamField>
<ParamField path="baseUrl" type="string">
  بازنویسی مبدأ URL نمایشگر. `viewerBaseUrl` متعلق به Plugin را بازنویسی می‌کند. باید `http` یا `https` و بدون پرس‌وجو/هش باشد.
</ParamField>

<AccordionGroup>
  <Accordion title="اعتبارسنجی و محدودیت‌ها">
    - `before`/`after`: هرکدام حداکثر 512 KiB.
    - `patch`: حداکثر 2 MiB.
    - `path`: حداکثر 2048 بایت.
    - `lang`: حداکثر 128 بایت.
    - `title`: حداکثر 1024 بایت.
    - سقف پیچیدگی وصله: حداکثر 128 فایل و در مجموع 120000 خط.
    - استفادهٔ هم‌زمان از `patch` با `before`/`after` رد می‌شود.
    - محدودیت‌های ایمنی فایل رندرشده (PNG و PDF):
      - `fileQuality: "standard"`: حداکثر 8 MP ‏(8,000,000 پیکسل رندرشده).
      - `fileQuality: "hq"`: حداکثر 14 MP.
      - `fileQuality: "print"`: حداکثر 24 MP.
      - PDF نیز به 50 صفحه محدود می‌شود.

  </Accordion>
</AccordionGroup>

## برجسته‌سازی نحو

زبان‌های داخلی:

`javascript`، `typescript`، `tsx`، `jsx`، `json`، `markdown`، `yaml`، `css`، `html`، `sh`، `python`، `go`، `rust`، `java`، `c`، `cpp`، `csharp`، `php`، `sql`، `docker`، `ruby`، `swift`، `kotlin`، `r`، `dart`، `lua`، `powershell`، `xml` و `toml`.

نام‌های مستعار رایج (`js`، `ts`، `bash`، `md`، `yml`، `c++`، `dockerfile`، `rb`، `kt`، `ps1` و غیره) به آن زبان‌ها نرمال‌سازی می‌شوند.

برای زبان‌های بیشتر (Astro، Vue، Svelte، MDX، GraphQL، Terraform/HCL، Nix، Clojure، Elixir، Haskell، OCaml، Scala، Zig، Solidity، Verilog/VHDL، Fortran، MATLAB، LaTeX، Mermaid، Sass/Less/SCSS، Nginx، Apache، CSV، dotenv، INI، diff و موارد بیشتر)، Plugin بستهٔ زبان نمایشگر Diff را نصب کنید:

```bash
openclaw plugins install clawhub:@openclaw/diffs-language-pack
```

بدون این بسته، زبان‌های پشتیبانی‌نشده همچنان به‌شکل متن سادهٔ خوانا رندر می‌شوند. برای فهرست بالادستی، به [Plugin بستهٔ زبان Diffs](/fa/plugins/reference/diffs-language-pack) و [زبان‌های Shiki](https://shiki.style/languages) مراجعه کنید.

## قرارداد جزئیات خروجی

همهٔ نتایج موفق شامل `changed` هستند: ورودی پیش/پس یکسان، بدون ایجاد مصنوع، `false` را برمی‌گرداند؛ نتایج رندرشده `true` را برمی‌گردانند.

<AccordionGroup>
  <Accordion title="فیلدهای نمایشگر (حالت‌های view و both)">
    - `changed`
    - `artifactId`
    - `viewerUrl`
    - `viewerPath`
    - `title`
    - `expiresAt`
    - `inputKind`
    - `fileCount`
    - `mode`
    - `context` (`agentId`، `sessionId`، `messageChannel`، `agentAccountId` در صورت وجود)

  </Accordion>
  <Accordion title="فیلدهای فایل (حالت‌های file و both)">
    - `changed`
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
</AccordionGroup>

| حالت     | خروجی                                                                                         |
| -------- | ----------------------------------------------------------------------------------------------- |
| `"view"` | فقط فیلدهای نمایشگر.                                                                             |
| `"file"` | فقط فیلدهای فایل، بدون مصنوع نمایشگر.                                                           |
| `"both"` | فیلدهای نمایشگر به‌علاوهٔ فیلدهای فایل. اگر رندر فایل ناموفق باشد، نمایشگر همچنان با `fileError` برگردانده می‌شود. |

### بخش‌های بدون تغییرِ جمع‌شده

نمایشگر ردیف‌هایی مانند `N unmodified lines` نشان می‌دهد. کنترل‌های گسترش فقط زمانی ظاهر می‌شوند که diff رندرشده دادهٔ زمینهٔ قابل‌گسترش داشته باشد (که برای ورودی پیش/پس معمول است). بسیاری از وصله‌های یکپارچه بدنهٔ زمینه را در قطعه‌های خود حذف می‌کنند؛ بنابراین ممکن است ردیف بدون کنترل گسترش ظاهر شود—این رفتار مورد انتظار است، نه اشکال. `expandUnchanged` فقط زمانی اعمال می‌شود که زمینهٔ قابل‌گسترش وجود داشته باشد.

### پیمایش چندفایلی

وصله‌هایی که بیش از یک فایل را تغییر می‌دهند، با یک کارت خلاصهٔ فایل‌های تغییریافته آغاز می‌شوند: تعداد کل `+N` / `-N`، تعدادهای هر فایل، نشان‌های افزوده/حذف‌شده/تغییرنام‌یافته و پیوندهای لنگری که به هر فایل می‌پرند. فایل‌های PNG/PDF رندرشده تعدادهای سربرگ هر فایل را نگه می‌دارند، اما کلیدهای تعاملی نما را حذف می‌کنند، زیرا این کنترل‌ها در یک فایل ایستا کارایی ندارند.

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

کلیدهای پشتیبانی‌شدهٔ `defaults`:‏ `fontFamily`، `fontSize`، `lineSpacing`، `layout`، `showLineNumbers`، `diffIndicators`، `wordWrap`، `background`، `theme`، `fileFormat`، `fileQuality`، `fileScale`، `fileMaxWidth`، `mode`، `ttlSeconds`. پارامترهای صریح فراخوانی ابزار این موارد را بازنویسی می‌کنند.

### پیکربندی پایدار URL نمایشگر

<ParamField path="viewerBaseUrl" type="string">
  جایگزین تحت مالکیت Plugin برای پیوندهای نمایشگر برگشتی، هنگامی که فراخوانی ابزار `baseUrl` را ارسال نمی‌کند. باید `http` یا `https` و بدون پرس‌وجو/هش باشد.
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
  `false`: درخواست‌های غیرحلقه‌بازگشتی به مسیرهای نمایشگر رد می‌شوند. `true`: اگر مسیر توکن‌دار معتبر باشد، نمایشگرهای راه‌دور مجازند.
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

## چرخهٔ عمر و ذخیره‌سازی مصنوع

- مصنوع‌ها در `$TMPDIR/openclaw-diffs` قرار دارند.
- فرادادهٔ نمایشگر یک شناسهٔ مصنوع تصادفی 20 نویسه‌ای هگزادسیمال، یک توکن تصادفی 48 نویسه‌ای هگزادسیمال، `createdAt`/`expiresAt` و مسیر ذخیره‌شدهٔ `viewer.html` را نگه می‌دارد.
- TTL پیش‌فرض مصنوع: 30 دقیقه. حداکثر TTL پذیرفته‌شده: 6 ساعت.
- پاک‌سازی پس از هر فراخوانی ایجاد مصنوع و در صورت فراهم‌شدن فرصت اجرا می‌شود؛ مصنوع‌های منقضی‌شده حذف می‌شوند.
- پویش جایگزین، وقتی فراداده موجود نیست، پوشه‌های کهنه‌تر از 24 ساعت را حذف می‌کند.

## رفتار شبکه و URL نمایشگر

مسیر نمایشگر: `/plugins/diffs/view/{artifactId}/{token}`

دارایی‌های نمایشگر:

- `/plugins/diffs/assets/viewer.js`
- `/plugins/diffs/assets/viewer-runtime.js`
- `/plugins/diffs-language-pack/assets/viewer.js` (فقط زمانی که تفاوت از زبانِ یک بستهٔ زبانی استفاده می‌کند)

سند نمایشگر این دارایی‌ها را نسبت به نشانی اینترنتی نمایشگر تفکیک می‌کند، بنابراین پیشوند مسیر اختیاری `baseUrl` به درخواست‌های دارایی نیز منتقل می‌شود.

ترتیب تفکیک نشانی اینترنتی: `baseUrl` فراخوانی ابزار (پس از اعتبارسنجی سخت‌گیرانه) -> `viewerBaseUrl` مربوط به Plugin -> پیش‌فرض حلقهٔ بازگشتی `127.0.0.1`. اگر حالت اتصال Gateway برابر با `custom` باشد و `gateway.customBindHost` تنظیم شده باشد، به‌جای حلقهٔ بازگشتی از آن میزبان استفاده می‌شود.

قواعد `baseUrl`: باید `http://` یا `https://` باشد؛ کوئری و هش رد می‌شوند؛ مبدأ به‌همراه مسیر پایهٔ اختیاری مجاز است.

## مدل امنیتی

<AccordionGroup>
  <Accordion title="سخت‌سازی نمایشگر">
    - به‌طور پیش‌فرض فقط حلقهٔ بازگشتی.
    - مسیرهای توکن‌دار نمایشگر با اعتبارسنجی سخت‌گیرانهٔ الگوی شناسه و توکن.
    - سیاست CSP پاسخ نمایشگر: `default-src 'none'`؛ اسکریپت‌ها/دارایی‌ها فقط از خود مبدأ؛ بدون `connect-src` خروجی.
    - محدودسازی خطاهای دسترسی از راه دور در صورت فعال‌بودن دسترسی راه دور: 40 خطا در هر 60 ثانیه، قفل‌شدن 60 ثانیه‌ای را فعال می‌کند (`429 Too Many Requests`).

  </Accordion>
  <Accordion title="سخت‌سازی رندر فایل">
    - مسیریابی درخواست مرورگر برای نماگرفت به‌طور پیش‌فرض همه‌چیز را رد می‌کند.
    - فقط دارایی‌های محلی نمایشگر از `http://127.0.0.1/plugins/diffs/assets/*` مجاز هستند.
    - درخواست‌های شبکهٔ خارجی مسدود می‌شوند.

  </Accordion>
</AccordionGroup>

## نیازمندی‌های مرورگر برای حالت فایل

`mode: "file"` و `mode: "both"` به مرورگری سازگار با Chromium نیاز دارند.

ترتیب تفکیک:

<Steps>
  <Step title="پیکربندی">
    `browser.executablePath` در پیکربندی OpenClaw.
  </Step>
  <Step title="متغیرهای محیطی">
    - `OPENCLAW_BROWSER_EXECUTABLE_PATH`
    - `BROWSER_EXECUTABLE_PATH`
    - `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`

  </Step>
  <Step title="گزینهٔ جایگزین پلتفرم">
    مسیرهای نصب رایج و جست‌وجوهای `PATH` برای Chrome، Chromium، Edge و Brave.
  </Step>
</Steps>

متن رایج خطا: `Diff PNG/PDF rendering requires a Chromium-compatible browser...`. برای رفع آن، Chrome، Chromium، Edge یا Brave را نصب کنید، یا یکی از گزینه‌های مسیر فایل اجرایی بالا را تنظیم کنید.

## عیب‌یابی

<AccordionGroup>
  <Accordion title="خطاهای اعتبارسنجی ورودی">
    - `Provide patch or both before and after text.` -- هر دو مورد `before` و `after` را وارد کنید، یا `patch` را ارائه دهید.
    - `Provide either patch or before/after input, not both.` -- حالت‌های ورودی را با هم ترکیب نکنید.
    - `Invalid baseUrl: ...` -- از مبدأ `http(s)` با مسیر اختیاری و بدون کوئری/هش استفاده کنید.
    - `{field} exceeds maximum size (...)` -- اندازهٔ محموله را کاهش دهید.
    - رد وصلهٔ بزرگ -- تعداد فایل‌های وصله یا مجموع خطوط را کاهش دهید.

  </Accordion>
  <Accordion title="دسترس‌پذیری نمایشگر">
    - نشانی اینترنتی نمایشگر به‌طور پیش‌فرض به `127.0.0.1` تفکیک می‌شود.
    - برای دسترسی از راه دور، یا `viewerBaseUrl` مربوط به Plugin را تنظیم کنید، یا در هر فراخوانی `baseUrl` را ارسال کنید، یا از `gateway.bind=custom` همراه با `gateway.customBindHost` استفاده کنید.
    - اگر `gateway.trustedProxies` شامل حلقهٔ بازگشتی برای پراکسیِ همان میزبان باشد (برای مثال Tailscale Serve)، درخواست‌های خام نمایشگر از حلقهٔ بازگشتی که فاقد سرآیندهای ارسال‌شدهٔ IP کارخواه هستند، طبق طراحی با حالت بسته شکست می‌خورند.
    - برای آن توپولوژی پراکسی، برای پیوست `mode: "file"`/`"both"` را ترجیح دهید، یا برای پیوند قابل‌اشتراک نمایشگر، `security.allowRemoteViewer` را به‌عمد همراه با `viewerBaseUrl` مربوط به Plugin/یک `baseUrl` پراکسی فعال کنید.
    - فقط زمانی `security.allowRemoteViewer` را فعال کنید که دسترسی خارجی به نمایشگر موردنظر باشد.

  </Accordion>
  <Accordion title="ردیف خطوط تغییریافته دکمهٔ بازکردن ندارد">
    این رفتار برای ورودی وصله‌ای که فاقد بافت قابل‌گسترش است مورد انتظار است؛ خطای نمایشگر نیست.
  </Accordion>
  <Accordion title="مصنوع یافت نشد">
    - مصنوع به‌دلیل TTL منقضی شده است.
    - توکن یا مسیر تغییر کرده است.
    - پاک‌سازی داده‌های کهنه را حذف کرده است.

  </Accordion>
</AccordionGroup>

## راهنمای عملیاتی

- برای بازبینی‌های تعاملی محلی در بوم، `mode: "view"` را ترجیح دهید.
- برای کانال‌های گفت‌وگوی خروجی که به پیوست نیاز دارند، `mode: "file"` را ترجیح دهید.
- مگر اینکه استقرار شما به نشانی‌های اینترنتی نمایشگر راه دور نیاز داشته باشد، `allowRemoteViewer` را غیرفعال نگه دارید.
- برای تفاوت‌های حساس، یک `ttlSeconds` کوتاه و صریح تنظیم کنید.
- اگر لازم نیست، از ارسال اسرار در ورودی تفاوت خودداری کنید.
- اگر کانال شما تصاویر را به‌شدت فشرده می‌کند (برای مثال Telegram یا WhatsApp)، خروجی PDF را ترجیح دهید (`fileFormat: "pdf"`).

<Note>
موتور رندر تفاوت‌ها با پشتیبانی [Diffs](https://diffs.com).
</Note>

## مطالب مرتبط

- [مرورگر](/fa/tools/browser)
- [Pluginها](/fa/tools/plugin)
- [نمای کلی ابزارها](/fa/tools)
