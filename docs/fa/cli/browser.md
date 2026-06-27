---
read_when:
    - از `openclaw browser` استفاده می‌کنید و برای کارهای رایج نمونه می‌خواهید
    - می‌خواهید مرورگری را که روی دستگاه دیگری اجرا می‌شود از طریق میزبان Node کنترل کنید.
    - می‌خواهید از طریق Chrome MCP به Chrome محلیِ واردشده‌تان متصل شوید.
summary: CLI reference برای `openclaw browser` (چرخهٔ حیات، پروفایل‌ها، تب‌ها، کنش‌ها، وضعیت، و اشکال‌زدایی)
title: مرورگر
x-i18n:
    generated_at: "2026-06-27T17:22:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d9e45a6b89f23623c25b61d41273151b60da1fc415b5d3c901d8c555d8244f7a
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

سطح کنترل مرورگر OpenClaw را مدیریت کنید و کنش‌های مرورگر را اجرا کنید (چرخه عمر، پروفایل‌ها، زبانه‌ها، اسنپ‌شات‌ها، اسکرین‌شات‌ها، ناوبری، ورودی، شبیه‌سازی وضعیت، و اشکال‌زدایی).

مرتبط:

- ابزار مرورگر + API: [ابزار مرورگر](/fa/tools/browser)

## پرچم‌های رایج

- `--url <gatewayWsUrl>`: نشانی WebSocket مربوط به Gateway (پیش‌فرض از پیکربندی).
- `--token <token>`: توکن Gateway (در صورت نیاز).
- `--timeout <ms>`: مهلت زمانی درخواست (میلی‌ثانیه).
- `--expect-final`: منتظر پاسخ نهایی Gateway بمان.
- `--browser-profile <name>`: یک پروفایل مرورگر انتخاب کن (پیش‌فرض از پیکربندی).
- `--json`: خروجی قابل خواندن برای ماشین (در موارد پشتیبانی‌شده).

## شروع سریع (محلی)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

عامل‌ها می‌توانند همین بررسی آمادگی را با `browser({ action: "doctor" })` اجرا کنند.

## عیب‌یابی سریع

اگر `start` با `not reachable after start` شکست خورد، ابتدا آمادگی CDP را عیب‌یابی کنید. اگر `start` و `tabs` موفق شدند اما `open` یا `navigate` شکست خورد، سطح کنترل مرورگر سالم است و خطا معمولا به سیاست SSRF ناوبری مربوط می‌شود.

دنباله حداقلی:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

راهنمای دقیق: [عیب‌یابی مرورگر](/fa/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

## چرخه عمر

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep
openclaw browser start
openclaw browser start --headless
openclaw browser stop
openclaw browser --browser-profile openclaw reset-profile
```

نکات:

- `doctor --deep` یک بررسی زنده اسنپ‌شات اضافه می‌کند. وقتی آمادگی پایه CDP سبز است اما می‌خواهید اثبات کنید زبانه فعلی قابل بازرسی است، مفید است.
- برای پروفایل‌های `attachOnly` و CDP راه‌دور، `openclaw browser stop` نشست کنترل فعال را می‌بندد و بازنویسی‌های موقت شبیه‌سازی را پاک می‌کند، حتی وقتی OpenClaw فرایند مرورگر را خودش راه‌اندازی نکرده باشد.
- برای پروفایل‌های مدیریت‌شده محلی، `openclaw browser stop` فرایند مرورگر ایجادشده را متوقف می‌کند.
- `openclaw browser start --headless` فقط روی همان درخواست شروع اعمال می‌شود و فقط وقتی OpenClaw یک مرورگر مدیریت‌شده محلی را راه‌اندازی می‌کند. این دستور `browser.headless` یا پیکربندی پروفایل را بازنویسی نمی‌کند، و برای مرورگری که از قبل در حال اجراست هیچ اثری ندارد.
- روی میزبان‌های Linux بدون `DISPLAY` یا `WAYLAND_DISPLAY`، پروفایل‌های مدیریت‌شده محلی به‌طور خودکار بی‌سر اجرا می‌شوند، مگر اینکه `OPENCLAW_BROWSER_HEADLESS=0`، `browser.headless=false`، یا `browser.profiles.<name>.headless=false` صراحتا مرورگر قابل مشاهده درخواست کند.

## اگر فرمان موجود نیست

اگر `openclaw browser` فرمانی ناشناخته است، `plugins.allow` را در `~/.openclaw/openclaw.json` بررسی کنید.

وقتی `plugins.allow` وجود دارد، Plugin مرورگر بسته‌بندی‌شده را صراحتا فهرست کنید، مگر اینکه پیکربندی از قبل یک بلوک ریشه `browser` داشته باشد:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

یک بلوک ریشه صریح `browser`، مثلا `browser.enabled=true` یا `browser.profiles.<name>`، Plugin مرورگر بسته‌بندی‌شده را نیز زیر یک فهرست مجاز محدودکننده Plugin فعال می‌کند.

مرتبط: [ابزار مرورگر](/fa/tools/browser#missing-browser-command-or-tool)

## پروفایل‌ها

پروفایل‌ها پیکربندی‌های نام‌گذاری‌شده مسیریابی مرورگر هستند. در عمل:

- `openclaw`: یک نمونه اختصاصی Chrome مدیریت‌شده توسط OpenClaw را راه‌اندازی می‌کند یا به آن متصل می‌شود (دایرکتوری داده کاربر ایزوله).
- `user`: نشست Chrome موجود و واردشده شما را از طریق Chrome DevTools MCP کنترل می‌کند.
- پروفایل‌های سفارشی CDP: به یک نقطه پایانی CDP محلی یا راه‌دور اشاره می‌کنند.

```bash
openclaw browser profiles
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

از یک پروفایل مشخص استفاده کنید:

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

`tabs` ابتدا `suggestedTargetId` را برمی‌گرداند، سپس `tabId` پایدار مانند `t1`، برچسب اختیاری، و `targetId` خام را. عامل‌ها باید `suggestedTargetId` را دوباره به `focus`، `close`، اسنپ‌شات‌ها، و کنش‌ها بدهند. می‌توانید با `open --label`، `tab new --label`، یا `tab label` یک برچسب اختصاص دهید؛ برچسب‌ها، شناسه‌های زبانه، شناسه‌های خام هدف، و پیشوندهای یکتای شناسه هدف همگی پذیرفته می‌شوند.
فیلد درخواست برای سازگاری همچنان `targetId` نام دارد، اما این ارجاع‌های زبانه را می‌پذیرد. شناسه‌های خام هدف را به‌عنوان دسته‌های تشخیصی در نظر بگیرید، نه حافظه پایدار عامل.
وقتی Chromium هدف خام زیربنایی را هنگام ناوبری یا ارسال فرم جایگزین می‌کند، OpenClaw در صورت امکان اثبات تطابق، `tabId`/برچسب پایدار را به زبانه جایگزین متصل نگه می‌دارد. شناسه‌های خام هدف همچنان ناپایدار هستند؛ `suggestedTargetId` را ترجیح دهید.

## اسنپ‌شات / اسکرین‌شات / کنش‌ها

اسنپ‌شات:

```bash
openclaw browser snapshot
openclaw browser snapshot --urls
```

اسکرین‌شات:

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref e12
openclaw browser screenshot --labels
```

نکات:

- `--full-page` فقط برای گرفتن تصویر صفحه است؛ نمی‌توان آن را با `--ref` یا `--element` ترکیب کرد.
- پروفایل‌های `existing-session` / `user` از اسکرین‌شات‌های صفحه و اسکرین‌شات‌های `--ref` از خروجی اسنپ‌شات پشتیبانی می‌کنند، اما از اسکرین‌شات‌های CSS `--element` پشتیبانی نمی‌کنند.
- `--labels` ارجاع‌های اسنپ‌شات فعلی را روی اسکرین‌شات قرار می‌دهد. روی پروفایل‌های مبتنی بر Playwright، با `--full-page` (هم‌پوشانی برچسب کل صفحه)، `--ref` (هم‌پوشانی برچسب برش عنصر بر اساس ارجاع ARIA)، و `--element` (هم‌پوشانی برچسب برش عنصر بر اساس انتخابگر CSS) کار می‌کند؛ در حالت‌های برش عنصر، برچسب‌ها نسبت به عنصر تصویر می‌شوند. پاسخ همچنین یک آرایه `annotations` با کادر محدودکننده هر ارجاع دارد. هر مورد دارای `ref`، `number`، `role`، `name` اختیاری، و `box: {x, y, width, height}` است؛ مختصات در فضای تصویر گرفته‌شده هستند (نما / کل صفحه / نسبی به عنصر). وقتی خالی باشد، فیلد حذف می‌شود.
  پروفایل‌های `existing-session` یک هم‌پوشانی chrome-mcp را روی اسکرین‌شات‌های صفحه رندر می‌کنند، اما از کمک‌گر تصویرسازی Playwright استفاده نمی‌کنند و `annotations` را شامل نمی‌شوند؛ اسکرین‌شات‌های CSS `--element` در آنجا پشتیبانی نمی‌شوند. بدون Playwright یا chrome-mcp، اسکرین‌شات‌های برچسب‌دار در دسترس نیستند. نسخه‌های قبلی `--full-page`، `--ref`، و `--element` را روی اسکرین‌شات‌های برچسب‌دار Playwright نادیده می‌گرفتند و همیشه یک تصویر نما برمی‌گرداندند؛ اسکرین‌شات‌های برچسب‌دار اکنون به آن دامنه‌ها احترام می‌گذارند.
- `snapshot --urls` مقصدهای پیوند کشف‌شده را به اسنپ‌شات‌های هوش مصنوعی اضافه می‌کند تا عامل‌ها بتوانند به‌جای حدس زدن فقط از متن پیوند، مقصدهای ناوبری مستقیم را انتخاب کنند.

ناوبری/کلیک/تایپ (اتوماسیون رابط کاربری مبتنی بر ارجاع):

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
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
```

`evaluate --fn` منبع یک تابع، یک عبارت، یا بدنه یک دستور را می‌پذیرد. بدنه‌های دستور به‌صورت تابع‌های async پیچیده می‌شوند، بنابراین برای مقداری که می‌خواهید برگردد از `return` استفاده کنید. وقتی تابع سمت صفحه ممکن است بیشتر از مهلت زمانی پیش‌فرض evaluate زمان نیاز داشته باشد، از `evaluate --timeout-ms <ms>` استفاده کنید.

پاسخ‌های کنش پس از جایگزینی صفحه بر اثر کنش، وقتی OpenClaw بتواند زبانه جایگزین را اثبات کند، `targetId` خام فعلی را برمی‌گردانند. اسکریپت‌ها همچنان باید برای گردش‌کارهای بلندمدت `suggestedTargetId`/برچسب‌ها را ذخیره و ارسال کنند.

کمک‌گرهای فایل + گفت‌وگو:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

پروفایل‌های Chrome مدیریت‌شده دانلودهای عادی آغازشده با کلیک را در دایرکتوری دانلودهای OpenClaw ذخیره می‌کنند (`/tmp/openclaw/downloads` به‌صورت پیش‌فرض، یا ریشه موقت پیکربندی‌شده). وقتی عامل باید منتظر یک فایل مشخص بماند و مسیر آن را برگرداند، از `waitfordownload` یا `download` استفاده کنید؛ این انتظارگرهای صریح مالک دانلود بعدی هستند.
آپلودها فایل‌ها را از ریشه آپلودهای موقت OpenClaw و رسانه ورودی مدیریت‌شده توسط OpenClaw می‌پذیرند، از جمله ارجاع‌های `media://inbound/<id>` و `media/inbound/<id>` نسبی به سندباکس. ارجاع‌های رسانه تودرتو، پیمایش مسیر، و مسیرهای محلی دلخواه همچنان رد می‌شوند.
وقتی یک کنش یک گفت‌وگوی مودال باز می‌کند، پاسخ کنش `blockedByDialog` را همراه با `browserState.dialogs.pending` برمی‌گرداند؛ برای پاسخ مستقیم به آن، `--dialog-id` را بدهید. گفت‌وگوهایی که بیرون از OpenClaw رسیدگی شده‌اند زیر `browserState.dialogs.recent` ظاهر می‌شوند.

## وضعیت و ذخیره‌سازی

نما + شبیه‌سازی:

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
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

مسیر پیش‌فرض existing-session، اتصال خودکار Chrome MCP فقط روی میزبان است. اگر مرورگر از قبل با یک نقطه پایانی DevTools در حال اجراست، `--cdp-url` را بدهید تا Chrome MCP به‌جای آن به همان نقطه پایانی متصل شود.
برای Docker، Browserless، یا راه‌اندازی‌های راه‌دور دیگری که معناشناسی Chrome MCP لازم نیست، از یک پروفایل CDP استفاده کنید.

محدودیت‌های فعلی existing-session:

- اقدام‌های مبتنی بر snapshot از ارجاع‌ها استفاده می‌کنند، نه انتخابگرهای CSS
- وقتی فراخوان‌ها `timeoutMs` را حذف کنند، مقدار پیش‌فرض `browser.actionTimeoutMs` برای درخواست‌های پشتیبانی‌شده `act` برابر 60000 ms است؛ `timeoutMs` در هر فراخوانی همچنان اولویت دارد.
- `click` فقط کلیک چپ است
- `type` از `slowly=true` پشتیبانی نمی‌کند
- `press` از `delayMs` پشتیبانی نمی‌کند
- `hover`، `scrollintoview`، `drag`، `select`، `fill` و `evaluate` بازنویسی‌های مهلت زمانی در هر فراخوانی را رد می‌کنند
- `select` فقط از یک مقدار پشتیبانی می‌کند
- `wait --load networkidle` در پروفایل‌های نشست موجود پشتیبانی نمی‌شود (روی CDP مدیریت‌شده و خام/راه‌دور کار می‌کند)
- بارگذاری فایل به `--ref` / `--input-ref` نیاز دارد، از `--element` مبتنی بر CSS پشتیبانی نمی‌کند، و در حال حاضر فقط یک فایل را در هر بار پشتیبانی می‌کند
- هوک‌های دیالوگ از `--timeout` پشتیبانی نمی‌کنند
- اسکرین‌شات‌ها از ثبت صفحه و `--ref` پشتیبانی می‌کنند، اما از `--element` مبتنی بر CSS پشتیبانی نمی‌کنند
- `responsebody`، رهگیری دانلود، خروجی PDF و اقدام‌های دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند

## کنترل مرورگر راه‌دور (پراکسی میزبان Node)

اگر Gateway روی دستگاهی متفاوت از مرورگر اجرا می‌شود، یک **میزبان Node** را روی دستگاهی اجرا کنید که Chrome/Brave/Edge/Chromium دارد. Gateway اقدام‌های مرورگر را به آن Node پراکسی می‌کند (به سرور جداگانه برای کنترل مرورگر نیاز نیست).

از `gateway.nodes.browser.mode` برای کنترل مسیریابی خودکار و از `gateway.nodes.browser.node` برای ثابت کردن یک Node مشخص، در صورت اتصال چندین Node، استفاده کنید.

امنیت + راه‌اندازی راه‌دور: [ابزار مرورگر](/fa/tools/browser)، [دسترسی راه‌دور](/fa/gateway/remote)، [Tailscale](/fa/gateway/tailscale)، [امنیت](/fa/gateway/security)

## مرتبط

- [مرجع CLI](/fa/cli)
- [مرورگر](/fa/tools/browser)
