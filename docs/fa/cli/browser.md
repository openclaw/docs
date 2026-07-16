---
read_when:
    - از `openclaw browser` استفاده می‌کنید و برای کارهای رایج مثال می‌خواهید
    - می‌خواهید مرورگری را که روی دستگاهی دیگر اجرا می‌شود، از طریق یک میزبان Node کنترل کنید
    - می‌خواهید از طریق Chrome MCP به Chrome محلی خود که در آن وارد حساب شده‌اید متصل شوید
summary: مرجع CLI برای `openclaw browser` (چرخهٔ حیات، پروفایل‌ها، زبانه‌ها، کنش‌ها، وضعیت و اشکال‌زدایی)
title: مرورگر
x-i18n:
    generated_at: "2026-07-16T15:40:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 50e9da3fa6899d830e38d8548313c70b5615c2ed3d70dd372a1fe147ff5db053
    source_path: cli/browser.md
    workflow: 16
---

# `openclaw browser`

سطح کنترل مرورگر OpenClaw را مدیریت کنید و عملیات مرورگر را اجرا کنید: چرخه عمر، پروفایل‌ها، زبانه‌ها، نماهای لحظه‌ای، نماگرفت‌ها، پیمایش، ورودی، شبیه‌سازی وضعیت و اشکال‌زدایی.

مرتبط: [ابزار مرورگر](/fa/tools/browser)

## پرچم‌های رایج

- `--url <gatewayWsUrl>`: نشانی WebSocket مربوط به Gateway (پیش‌فرض از پیکربندی).
- `--token <token>`: توکن Gateway (در صورت نیاز).
- `--timeout <ms>`: مهلت زمانی درخواست برحسب میلی‌ثانیه (پیش‌فرض: `30000`).
- `--expect-final`: انتظار برای پاسخ نهایی Gateway.
- `--browser-profile <name>`: انتخاب یک پروفایل مرورگر (پیش‌فرض: `openclaw` یا `browser.defaultProfile`).
- `--json`: خروجی قابل‌خواندن برای ماشین (در موارد پشتیبانی‌شده). این گزینه در سطح مرورگر است، بنابراین
  برای داشتن قالبی بدون ابهام، آن را پیش از زیرفرمان قرار دهید؛ مانند
  `openclaw browser --json status`. قرار دادن آن در انتها، مانند
  `openclaw browser status --json`، نیز زمانی کار می‌کند که فرمان فرزند انتخاب‌شده
  گزینه `--json` مخصوص خود را تعریف نکرده باشد.

## شروع سریع (محلی)

```bash
openclaw browser profiles
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

عامل‌ها می‌توانند همین بررسی آمادگی را با `browser({ action: "doctor" })` اجرا کنند.

## عیب‌یابی سریع

اگر `start` با `not reachable after start` ناموفق شد، ابتدا آمادگی CDP را عیب‌یابی کنید. اگر `start` و `tabs` موفق می‌شوند اما `open` یا `navigate` ناموفق است، صفحه کنترل مرورگر سالم است و خرابی معمولاً ناشی از مسدودسازی پیمایش توسط سیاست SSRF است.

توالی حداقلی:

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

راهنمای تفصیلی: [عیب‌یابی مرورگر](/fa/tools/browser#cdp-startup-failure-vs-navigation-ssrf-block)

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

- `doctor --deep` یک کاوش زنده از نمای لحظه‌ای اضافه می‌کند: زمانی مفید است که آمادگی پایه CDP سبز باشد، اما بخواهید اثبات کنید زبانه فعلی قابل بررسی است.
- برای یک پروفایل مدیریت‌شده محلی در حال اجرا، `status` و `doctor` تشخیص‌های
  گرافیکی ذخیره‌شده در حافظه نهان از Chrome را گزارش می‌کنند: طبقه‌بندی سخت‌افزاری/نرم‌افزاری، رندرکننده،
  پشتیبان، دستگاه/راه‌انداز، جزئیات قابلیت‌ها و وضعیت غیرفعال‌بودن، و قابلیت‌های
  ویدیویی شتاب‌یافته. `openclaw browser --json status` بار کامل ساخت‌یافته را برمی‌گرداند.
  وضعیت غیرفعال هرگز فقط برای جمع‌آوری این اطلاعات Chrome را اجرا نمی‌کند.
- `stop` نشست کنترل فعال را می‌بندد و جایگزین‌های موقت شبیه‌سازی را حتی برای `attachOnly` و پروفایل‌های CDP راه‌دور که OpenClaw فرایند مرورگرشان را خودش اجرا نکرده است، پاک می‌کند. برای پروفایل‌های مدیریت‌شده محلی، `stop` فرایند مرورگر ایجادشده را نیز متوقف می‌کند.
- `start --headless` فقط روی همان درخواست شروع اعمال می‌شود و فقط زمانی که OpenClaw یک مرورگر مدیریت‌شده محلی را اجرا کند. این گزینه `browser.headless` یا پیکربندی پروفایل را بازنویسی نمی‌کند و برای مرورگری که از قبل در حال اجراست، اثری ندارد.
- در میزبان‌های Linux فاقد `DISPLAY` یا `WAYLAND_DISPLAY`، پروفایل‌های مدیریت‌شده محلی به‌طور خودکار بدون رابط گرافیکی اجرا می‌شوند، مگر اینکه `OPENCLAW_BROWSER_HEADLESS=0`، `browser.headless=false` یا `browser.profiles.<name>.headless=false` صراحتاً مرورگری قابل‌مشاهده درخواست کند.

## اگر فرمان موجود نیست

اگر `openclaw browser` فرمانی ناشناخته است، `plugins.allow` را در `~/.openclaw/openclaw.json` بررسی کنید. وقتی `plugins.allow` وجود دارد، Plugin مرورگر همراه را صراحتاً فهرست کنید، مگر اینکه پیکربندی از قبل یک بلوک ریشه `browser` داشته باشد:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

یک بلوک ریشه صریح `browser` (برای نمونه `browser.enabled=true` یا `browser.profiles.<name>`) نیز Plugin مرورگر همراه را تحت یک فهرست مجاز محدودکننده Plugin فعال می‌کند.

مرتبط: [ابزار مرورگر](/fa/tools/browser#missing-browser-command-or-tool)

## پروفایل‌ها

پروفایل‌ها پیکربندی‌های نام‌گذاری‌شده مسیریابی مرورگر هستند:

- `openclaw` (پیش‌فرض): یک نمونه اختصاصی Chrome تحت مدیریت OpenClaw را اجرا می‌کند یا به آن متصل می‌شود (دایرکتوری داده کاربر مجزا).
- `user`: نشست موجود و واردشده شما در Chrome را از طریق Chrome DevTools MCP کنترل می‌کند.
- پروفایل‌های سفارشی CDP: به یک نقطه پایانی محلی یا راه‌دور CDP اشاره می‌کنند.

```bash
openclaw browser profiles
openclaw browser system-profiles
openclaw browser system-profiles --browser brave
openclaw browser import-profile --browser chrome --system Default --into imported
openclaw browser import-profile --system "Profile 1" --into work --domains google.com,youtube.com
openclaw browser create-profile --name work --color "#FF5A36"
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name remote --cdp-url https://browser-host.example.com
openclaw browser delete-profile --name work
```

با استفاده از `--browser-profile <name>` در هر زیرفرمان، یک پروفایل مشخص را به‌کار ببرید؛ برای نمونه `openclaw browser --browser-profile work tabs`.

در macOS، گزینه `system-profiles` پروفایل‌های واقعی Chrome، Brave، Edge یا Chromium موجود در میزبان را فهرست می‌کند. `import-profile` پس از یک درخواست رضایت macOS Keychain/Touch ID، کوکی‌های آن‌ها را رمزگشایی می‌کند و در یک پروفایل تازه تحت مدیریت OpenClaw تزریق می‌کند. این گزینه فقط کوکی‌ها را وارد می‌کند؛ ذخیره‌سازی محلی و IndexedDB بدون تغییر می‌مانند. برخی نشست‌های Google از اعتبارنامه‌های نشست مقید به دستگاه (DBSC) استفاده می‌کنند و ممکن است پس از واردکردن همچنان به احراز هویت دوباره نیاز داشته باشند.

وقتی برنامه macOS از یک Gateway محلی استفاده می‌کند، می‌تواند این واردکردن را یک‌بار پیشنهاد دهد و پروفایل مجزای واردشده را به پیش‌فرض مرور عامل تبدیل کند. واردکردن همیشه به کلیک صریح نیاز دارد؛ واردکردن موفق یا ردکردن، درخواست‌های خودکار بعدی را متوقف می‌کند و **Settings → General → Browser login** برای واردکردن دوباره همچنان در دسترس می‌ماند.

واردکردن پروفایل سیستم به‌طور پیش‌فرض فعال است. برای غیرفعال‌کردن واردکردن‌های آغازشده از CLI و عامل، `browser.allowSystemProfileImport=false` را تنظیم کنید. واردکردن در میزبان محلی انجام می‌شود و نمی‌تواند از طریق پروکسی Node مرورگر اجرا شود.

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

`tabs` ابتدا `suggestedTargetId`، سپس `tabId` پایدار (مانند `t1`)، برچسب اختیاری و `targetId` خام را برمی‌گرداند. `suggestedTargetId` را دوباره به `focus`، `close`، نماهای لحظه‌ای و عملیات بدهید. با `open --label`، `tab new --label` یا `tab label` یک برچسب اختصاص دهید؛ برچسب‌ها، شناسه‌های زبانه، شناسه‌های خام هدف و پیشوندهای یکتای شناسه هدف همگی پذیرفته می‌شوند. نام فیلد درخواست برای سازگاری همچنان `targetId` است، اما هر یک از این ارجاع‌های زبانه را می‌پذیرد.

شناسه‌های خام هدف، دستگیره‌های تشخیصی ناپایدارند، نه حافظه پایدار عامل: هنگامی که Chromium هدف خام زیربنایی را در جریان پیمایش یا ارسال فرم جایگزین می‌کند، OpenClaw در صورتی که بتواند تطابق را اثبات کند، `tabId`/برچسب پایدار را به زبانه جایگزین متصل نگه می‌دارد. `suggestedTargetId` را ترجیح دهید.

## نمای لحظه‌ای / نماگرفت / عملیات

نمای لحظه‌ای:

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

- `--full-page` فقط برای ثبت صفحه است؛ نمی‌توان آن را با `--ref` یا `--element` ترکیب کرد.
- پروفایل‌های `existing-session` / `user` از نماگرفت‌های صفحه و نماگرفت‌های `--ref` از خروجی نمای لحظه‌ای پشتیبانی می‌کنند، اما از نماگرفت‌های CSS با `--element` پشتیبانی نمی‌کنند.
- `--labels` ارجاع‌های نمای لحظه‌ای فعلی را روی نماگرفت هم‌پوشانی می‌کند. در پروفایل‌های مبتنی بر Playwright، این گزینه با `--full-page` (هم‌پوشانی تمام‌صفحه)، `--ref` (هم‌پوشانی برش عنصر بر پایه ارجاع ARIA) و `--element` (هم‌پوشانی برش عنصر بر پایه انتخابگر CSS) کار می‌کند؛ در حالت‌های برش عنصر، برچسب‌ها نسبت به عنصر نگاشت می‌شوند. پاسخ همچنین شامل آرایه `annotations` است (در صورت خالی‌بودن حذف می‌شود) که کادر محدودکننده هر ارجاع را دربر دارد: `ref`، `number`، `role`، `name` اختیاری و `box: {x, y, width, height}` در فضای مختصات تصویر ثبت‌شده (نما / تمام‌صفحه / نسبت به عنصر).
  پروفایل‌های `existing-session` یک هم‌پوشانی chrome-mcp را روی نماگرفت‌های صفحه رندر می‌کنند، اما از ابزار کمکی نگاشت Playwright استفاده نمی‌کنند و شامل `annotations` نمی‌شوند؛ نماگرفت‌های CSS با `--element` در آنجا پشتیبانی نمی‌شوند. بدون Playwright یا chrome-mcp، نماگرفت‌های برچسب‌دار در دسترس نیستند.
- `snapshot --urls` مقصدهای پیوند کشف‌شده را به نماهای لحظه‌ای هوش مصنوعی می‌افزاید تا عامل‌ها به‌جای حدس‌زدن از روی متن پیوند، اهداف پیمایش مستقیم را انتخاب کنند.

پیمایش/کلیک/تایپ (خودکارسازی رابط کاربری بر پایه ارجاع):

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

`evaluate --fn` منبع یک تابع، یک عبارت یا بدنه یک دستور را می‌پذیرد. بدنه‌های دستور در قالب توابع ناهمگام بسته‌بندی می‌شوند، بنابراین برای مقداری که می‌خواهید برگردانده شود از `return` استفاده کنید. هنگامی که تابع سمت صفحه ممکن است به زمان بیشتری از مهلت پیش‌فرض ارزیابی نیاز داشته باشد، از `--timeout-ms` استفاده کنید. `browser.evaluateEnabled=false` (پیش‌فرض: `true`) هر دو `evaluate` و `wait --fn` را غیرفعال می‌کند.

پاسخ عملیات، پس از جایگزینی صفحه ناشی از عملیات و در صورتی که OpenClaw بتواند زبانه جایگزین را اثبات کند، `targetId` خام فعلی را برمی‌گرداند. اسکریپت‌ها برای گردش‌کارهای طولانی‌مدت همچنان باید `suggestedTargetId`/برچسب‌ها را ذخیره و ارسال کنند.

ابزارهای کمکی فایل و گفت‌وگو:

```bash
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref <ref>
openclaw browser upload media://inbound/file.pdf --ref <ref>
openclaw browser waitfordownload
openclaw browser download <ref> report.pdf
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
```

پروفایل‌های مدیریت‌شده Chrome، دانلودهای عادی ناشی از کلیک را در دایرکتوری دانلودهای OpenClaw ذخیره می‌کنند (`/tmp/openclaw/downloads` به‌طور پیش‌فرض، یا ریشه موقت پیکربندی‌شده). وقتی عامل باید منتظر یک فایل مشخص بماند و مسیر آن را برگرداند، از `waitfordownload` یا `download` استفاده کنید؛ این انتظارگرهای صریح مالک دانلود بعدی هستند. بارگذاری‌ها فایل‌های موجود در ریشه موقت بارگذاری‌های OpenClaw و رسانه ورودی تحت مدیریت OpenClaw، از جمله ارجاع‌های `media://inbound/<id>` و `media/inbound/<id>` نسبت به محیط ایزوله، را می‌پذیرند. ارجاع‌های رسانه‌ای تودرتو، پیمایش مسیر و مسیرهای محلی دلخواه رد می‌شوند.

وقتی عملیاتی یک گفت‌وگوی وجهی باز می‌کند، پاسخ عملیات `blockedByDialog` را همراه با `browserState.dialogs.pending` برمی‌گرداند؛ برای پاسخ مستقیم به آن، `--dialog-id` را ارسال کنید. گفت‌وگوهایی که خارج از OpenClaw مدیریت می‌شوند، زیر `browserState.dialogs.recent` ظاهر می‌شوند.

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

کوکی‌ها + فضای ذخیره‌سازی:

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

از پروفایل داخلی `user` استفاده کنید، یا پروفایل `existing-session` خود را بسازید:

```bash
openclaw browser --browser-profile user tabs
openclaw browser create-profile --name chrome-live --driver existing-session
openclaw browser create-profile --name brave-live --driver existing-session --user-data-dir "~/Library/Application Support/BraveSoftware/Brave-Browser"
openclaw browser create-profile --name chrome-port --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser --browser-profile chrome-live tabs
```

مسیر پیش‌فرض نشست موجود، اتصال خودکار Chrome MCP فقط روی میزبان است. اگر مرورگر از قبل با یک نقطه پایانی DevTools در حال اجراست، `--cdp-url` را ارسال کنید تا Chrome MCP به‌جای آن به همان نقطه پایانی متصل شود. برای Docker، Browserless یا دیگر راه‌اندازی‌های راه‌دور که در آن‌ها معناشناسی Chrome MCP لازم نیست، به‌جای آن از یک پروفایل CDP استفاده کنید.

محدودیت‌های فعلی نشست موجود:

- کنش‌های مبتنی بر اسنپ‌شات از ارجاع‌ها استفاده می‌کنند، نه انتخاب‌گرهای CSS.
- `browser.actionTimeoutMs` وقتی فراخوان‌ها `timeoutMs` را حذف می‌کنند، درخواست‌های پشتیبانی‌شده `act` را به‌طور پیش‌فرض روی 60000 ms تنظیم می‌کند؛ `timeoutMs` در هر فراخوان همچنان اولویت دارد.
- `click` فقط از کلیک چپ پشتیبانی می‌کند.
- `type` از `slowly=true` پشتیبانی نمی‌کند.
- `press` از `delayMs` پشتیبانی نمی‌کند.
- `hover`، `scrollintoview`، `drag`، `select` و `fill` بازنویسی مهلت زمانی در هر فراخوان را رد می‌کنند؛ `evaluate` مقدار `--timeout-ms` را می‌پذیرد.
- `select` فقط از یک مقدار پشتیبانی می‌کند.
- `wait --load networkidle` پشتیبانی نمی‌شود (در پروفایل‌های مدیریت‌شده و CDP خام/راه‌دور کار می‌کند).
- بارگذاری فایل‌ها به `--ref` / `--input-ref` نیاز دارد، از `--element` مربوط به CSS پشتیبانی نمی‌کند و هر بار از یک فایل پشتیبانی می‌کند.
- قلاب‌های دیالوگ از `--timeout` پشتیبانی نمی‌کنند.
- اسکرین‌شات‌ها از ثبت صفحه و `--ref` پشتیبانی می‌کنند، اما از `--element` مربوط به CSS پشتیبانی نمی‌کنند.
- `responsebody`، رهگیری دانلود، خروجی PDF و کنش‌های دسته‌ای همچنان به یک مرورگر مدیریت‌شده یا پروفایل CDP خام نیاز دارند.

## کنترل مرورگر راه‌دور (پراکسی میزبان Node)

اگر Gateway روی دستگاهی متفاوت از مرورگر اجرا می‌شود، یک **میزبان Node** را روی دستگاهی اجرا کنید که Chrome/Brave/Edge/Chromium روی آن قرار دارد. Gateway کنش‌های مرورگر را از طریق آن Node پراکسی می‌کند؛ به سرور جداگانه‌ای برای کنترل مرورگر نیاز نیست.

برای کنترل مسیریابی خودکار از `gateway.nodes.browser.mode` و در صورت اتصال چند Node، برای تثبیت یک Node مشخص از `gateway.nodes.browser.node` استفاده کنید.

امنیت + راه‌اندازی راه‌دور: [ابزار مرورگر](/fa/tools/browser)، [دسترسی راه‌دور](/fa/gateway/remote)، [Tailscale](/fa/gateway/tailscale)، [امنیت](/fa/gateway/security)

## مرتبط

- [مرجع CLI](/fa/cli)
- [مرورگر](/fa/tools/browser)
