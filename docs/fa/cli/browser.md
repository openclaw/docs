---
read_when:
    - شما از `openclaw browser` استفاده می‌کنید و برای کارهای رایج مثال می‌خواهید
    - می‌خواهید مرورگری را که روی دستگاه دیگری اجرا می‌شود از طریق یک میزبان Node کنترل کنید
    - می‌خواهید از طریق Chrome MCP به Chrome محلیِ واردشدهٔ خود متصل شوید
summary: مرجع CLI برای `openclaw browser` (چرخهٔ حیات، پروفایل‌ها، زبانه‌ها، کنش‌ها، وضعیت، و اشکال‌زدایی)
title: مرورگر
x-i18n:
    generated_at: "2026-04-29T22:33:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7b5112c61e8289ab6a02bc30c9aefe640c053271f82197c0ee810b4a5efa580
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

سطح کنترل مرورگر OpenClaw را مدیریت کنید و کنش‌های مرورگر را اجرا کنید (چرخه حیات، پروفایل‌ها، زبانه‌ها، اسنپ‌شات‌ها، نماگرفت‌ها، ناوبری، ورودی، شبیه‌سازی وضعیت، و اشکال‌زدایی).

مرتبط:

- ابزار مرورگر + API: [ابزار مرورگر](/fa/tools/browser)

## پرچم‌های رایج

- `--url <gatewayWsUrl>`: URL وب‌سوکت Gateway (به‌طور پیش‌فرض از پیکربندی).
- `--token <token>`: توکن Gateway (در صورت نیاز).
- `--timeout <ms>`: مهلت زمانی درخواست (میلی‌ثانیه).
- `--expect-final`: منتظر پاسخ نهایی Gateway بمانید.
- `--browser-profile <name>`: یک پروفایل مرورگر انتخاب کنید (پیش‌فرض از پیکربندی).
- `--json`: خروجی قابل‌خواندن برای ماشین (در مواردی که پشتیبانی می‌شود).

## شروع سریع (محلی)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

عامل‌ها می‌توانند همان بررسی آمادگی را با `browser({ action: "doctor" })` اجرا کنند.

## عیب‌یابی سریع

اگر `start` با `not reachable after start` ناموفق شد، ابتدا آمادگی CDP را عیب‌یابی کنید. اگر `start` و `tabs` موفق شدند اما `open` یا `navigate` ناموفق شد، صفحه کنترل مرورگر سالم است و خرابی معمولا مربوط به سیاست SSRF ناوبری است.

توالی حداقلی:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

راهنمای تفصیلی: [عیب‌یابی مرورگر](/fa/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## چرخه حیات

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

نکته‌ها:

- `doctor --deep` یک پروب زنده اسنپ‌شات اضافه می‌کند. این زمانی مفید است که آمادگی پایه CDP سبز است اما می‌خواهید اثبات کنید زبانه فعلی قابل بازرسی است.
- برای پروفایل‌های `attachOnly` و CDP راه‌دور، `openclaw browser stop` نشست کنترل فعال را می‌بندد و بازنویسی‌های موقت شبیه‌سازی را پاک می‌کند، حتی زمانی که OpenClaw خودش فرایند مرورگر را راه‌اندازی نکرده باشد.
- برای پروفایل‌های محلی مدیریت‌شده، `openclaw browser stop` فرایند مرورگر ایجادشده را متوقف می‌کند.
- `openclaw browser start --headless` فقط برای همان درخواست شروع اعمال می‌شود و فقط زمانی که OpenClaw یک مرورگر محلی مدیریت‌شده را راه‌اندازی می‌کند. این دستور `browser.headless` یا پیکربندی پروفایل را بازنویسی نمی‌کند و برای مرورگری که از قبل در حال اجراست اثری ندارد.
- روی میزبان‌های Linux بدون `DISPLAY` یا `WAYLAND_DISPLAY`، پروفایل‌های محلی مدیریت‌شده به‌طور خودکار headless اجرا می‌شوند مگر اینکه `OPENCLAW_BROWSER_HEADLESS=0`، `browser.headless=false`، یا `browser.profiles.<name>.headless=false` صراحتا مرورگر قابل‌مشاهده درخواست کند.

## اگر فرمان وجود ندارد

اگر `openclaw browser` فرمانی ناشناخته است، `plugins.allow` را در `~/.openclaw/openclaw.json` بررسی کنید.

وقتی `plugins.allow` وجود دارد، Plugin مرورگر همراه را صراحتا فهرست کنید مگر اینکه پیکربندی از قبل یک بلوک ریشه `browser` داشته باشد:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

یک بلوک ریشه صریح `browser`، برای مثال `browser.enabled=true` یا `browser.profiles.<name>`، همچنین Plugin مرورگر همراه را تحت allowlist محدودکننده Plugin فعال می‌کند.

مرتبط: [ابزار مرورگر](/fa/tools/browser#missing-browser-command-or-tool)

## پروفایل‌ها

پروفایل‌ها پیکربندی‌های نام‌گذاری‌شده مسیریابی مرورگر هستند. در عمل:

- `openclaw`: یک نمونه اختصاصی Chrome مدیریت‌شده توسط OpenClaw را راه‌اندازی می‌کند یا به آن متصل می‌شود (دایرکتوری داده کاربر ایزوله).
- `user`: نشست Chrome موجود و واردشده شما را از طریق Chrome DevTools MCP کنترل می‌کند.
- پروفایل‌های CDP سفارشی: به یک نقطه پایانی CDP محلی یا راه‌دور اشاره می‌کنند.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

استفاده از یک پروفایل مشخص:

```bash
openclaw browser --browser-profile work tabs
```

## زبانه‌ها

```bash
openclaw browser tabs
openclaw browser tab new --label docs
openclaw browser tab label t1 docs
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://docs.openclaw.ai --label docs
openclaw browser focus docs
openclaw browser close t1
```

`tabs` ابتدا `suggestedTargetId`، سپس `tabId` پایدار مانند `t1`، برچسب اختیاری، و `targetId` خام را برمی‌گرداند. عامل‌ها باید `suggestedTargetId` را دوباره به `focus`، `close`، اسنپ‌شات‌ها، و کنش‌ها بدهند. می‌توانید با `open --label`، `tab new --label`، یا `tab label` یک برچسب اختصاص دهید؛ برچسب‌ها، شناسه‌های زبانه، شناسه‌های هدف خام، و پیشوندهای یکتای شناسه هدف همگی پذیرفته می‌شوند.
وقتی Chromium هدف خام زیرین را هنگام ناوبری یا ارسال فرم جایگزین می‌کند، OpenClaw در صورت امکان اثبات تطابق، `tabId`/برچسب پایدار را به زبانه جایگزین متصل نگه می‌دارد. شناسه‌های هدف خام همچنان ناپایدار هستند؛ `suggestedTargetId` را ترجیح دهید.

## اسنپ‌شات / نماگرفت / کنش‌ها

اسنپ‌شات:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

نماگرفت:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

نکته‌ها:

- `--full-page` فقط برای گرفتن تصویر از صفحه است؛ نمی‌توان آن را با `--ref` یا `--element` ترکیب کرد.
- پروفایل‌های `existing-session` / `user` از نماگرفت صفحه و نماگرفت‌های `--ref` از خروجی اسنپ‌شات پشتیبانی می‌کنند، اما از نماگرفت‌های CSS `--element` پشتیبانی نمی‌کنند.
- `--labels` refهای اسنپ‌شات فعلی را روی نماگرفت نمایش می‌دهد.
- `snapshot --urls` مقصدهای پیوند کشف‌شده را به اسنپ‌شات‌های AI اضافه می‌کند تا عامل‌ها بتوانند به‌جای حدس‌زدن فقط از متن پیوند، هدف‌های مستقیم ناوبری را انتخاب کنند.

ناوبری/کلیک/تایپ (خودکارسازی UI مبتنی بر ref):

```bash
openclaw browser navigate https://example.com
openclaw browser click <ref>
openclaw browser click-coords 120 340
openclaw browser type <ref> "hello"
openclaw browser press Enter
openclaw browser hover <ref>
openclaw browser scrollintoview <ref>
openclaw browser drag <startRef> <endRef>
openclaw browser select <ref> OptionA OptionB
openclaw browser fill --fields '[{"ref":"1","value":"Ada"}]'
openclaw browser wait --text "Done"
openclaw browser evaluate --fn '(el) => el.textContent' --ref <ref>
```

پاسخ‌های کنش، پس از جایگزینی صفحه که توسط کنش ایجاد شده، `targetId` خام فعلی را زمانی برمی‌گردانند که OpenClaw بتواند زبانه جایگزین را اثبات کند. اسکریپت‌ها همچنان باید برای گردش‌کارهای بلندمدت، `suggestedTargetId`/برچسب‌ها را ذخیره و ارسال کنند.

راهنماهای فایل + دیالوگ:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
```

پروفایل‌های Chrome مدیریت‌شده، دانلودهای معمولی آغازشده با کلیک را در دایرکتوری دانلودهای OpenClaw ذخیره می‌کنند (`/tmp/openclaw/downloads` به‌طور پیش‌فرض، یا ریشه موقت پیکربندی‌شده). وقتی عامل باید منتظر یک فایل مشخص بماند و مسیر آن را برگرداند، از `waitfordownload` یا `download` استفاده کنید؛ این منتظرهای صریح مالک دانلود بعدی هستند.

## وضعیت و ذخیره‌سازی

Viewport + شبیه‌سازی:

```bash
openclaw browser resize 1280 720
openclaw browser set viewport 1280 720
openclaw browser set offline on
openclaw browser set media dark
openclaw browser set timezone Europe/London
openclaw browser set locale en-GB
openclaw browser set geo 51.5074 -0.1278 --accuracy 25
openclaw browser set device "iPhone 14"
openclaw browser set headers '{"x-test":"1"}'
openclaw browser set credentials myuser mypass
```

کوکی‌ها + ذخیره‌سازی:

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url https://example.com
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set token abc123
openclaw browser storage session clear
```

## اشکال‌زدایی

```bash
openclaw browser console --level error
openclaw browser pdf
openclaw browser responsebody "**/api"
openclaw browser highlight <ref>
openclaw browser errors --clear
openclaw browser requests --filter api
openclaw browser trace start
openclaw browser trace stop --out trace.zip
```

## Chrome موجود از طریق MCP

از پروفایل داخلی `user` استفاده کنید، یا پروفایل `existing-session` خودتان را بسازید:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser --browser-profile chrome-live tabs
```

این مسیر فقط روی میزبان است. برای Docker، سرورهای headless، Browserless، یا تنظیمات راه‌دور دیگر، به‌جای آن از یک پروفایل CDP استفاده کنید.

محدودیت‌های فعلی existing-session:

- کنش‌های هدایت‌شده با اسنپ‌شات از refها استفاده می‌کنند، نه انتخابگرهای CSS
- وقتی فراخوان‌ها `timeoutMs` را حذف کنند، `browser.actionTimeoutMs` درخواست‌های پشتیبانی‌شده `act` را به‌طور پیش‌فرض روی 60000 میلی‌ثانیه می‌گذارد؛ `timeoutMs` هر فراخوان همچنان مقدم است.
- `click` فقط کلیک چپ است
- `type` از `slowly=true` پشتیبانی نمی‌کند
- `press` از `delayMs` پشتیبانی نمی‌کند
- `hover`، `scrollintoview`، `drag`، `select`، `fill`، و `evaluate` بازنویسی‌های مهلت زمانی هر فراخوان را رد می‌کنند
- `select` فقط از یک مقدار پشتیبانی می‌کند
- `wait --load networkidle` پشتیبانی نمی‌شود
- بارگذاری فایل به `--ref` / `--input-ref` نیاز دارد، از CSS `--element` پشتیبانی نمی‌کند، و در حال حاضر هر بار از یک فایل پشتیبانی می‌کند
- قلاب‌های دیالوگ از `--timeout` پشتیبانی نمی‌کنند
- نماگرفت‌ها از گرفتن تصویر صفحه و `--ref` پشتیبانی می‌کنند، اما از CSS `--element` پشتیبانی نمی‌کنند
- `responsebody`، رهگیری دانلود، خروجی PDF، و کنش‌های دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

## کنترل مرورگر راه‌دور (پروکسی میزبان node)

اگر Gateway روی ماشینی متفاوت از مرورگر اجرا می‌شود، یک **میزبان node** روی ماشینی اجرا کنید که Chrome/Brave/Edge/Chromium دارد. Gateway کنش‌های مرورگر را به آن node پروکسی می‌کند (سرور کنترل مرورگر جداگانه لازم نیست).

برای کنترل مسیریابی خودکار از `gateway.nodes.browser.mode` استفاده کنید و اگر چند node متصل هستند، برای ثابت‌کردن یک node مشخص از `gateway.nodes.browser.node` استفاده کنید.

امنیت + راه‌اندازی راه‌دور: [ابزار مرورگر](/fa/tools/browser)، [دسترسی راه‌دور](/fa/gateway/remote)، [Tailscale](/fa/gateway/tailscale)، [امنیت](/fa/gateway/security)

## مرتبط

- [مرجع CLI](/fa/cli)
- [مرورگر](/fa/tools/browser)
