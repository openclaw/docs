---
read_when:
    - اسکریپت‌نویسی یا اشکال‌زدایی مرورگر عامل از طریق API کنترل محلی
    - در جستجوی مرجع CLI ‏`openclaw browser`
    - افزودن خودکارسازی سفارشی مرورگر با نماگرفت‌ها و ارجاع‌ها
summary: API کنترل مرورگر OpenClaw، مرجع CLI، و اقدام‌های اسکریپت‌نویسی
title: رابط برنامه‌نویسی کاربردی کنترل مرورگر
x-i18n:
    generated_at: "2026-05-10T20:09:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: eec952e6befed8911b83fc554b1c08cc5f20d3deff9c6cc791cb8a009bb9e7f3
    source_path: tools/browser-control.md
    workflow: 16
---

برای راه‌اندازی، پیکربندی، و عیب‌یابی، [مرورگر](/fa/tools/browser) را ببینید.
این صفحه مرجع API کنترل HTTP محلی، CLI با نام `openclaw browser`
و الگوهای اسکریپت‌نویسی (اسنپ‌شات‌ها، refs، انتظارها، جریان‌های اشکال‌زدایی) است.

## API کنترل (اختیاری)

فقط برای یکپارچه‌سازی‌های محلی، Gateway یک API کوچک HTTP روی loopback ارائه می‌کند:

- وضعیت/شروع/توقف: `GET /`, `POST /start`, `POST /stop`
- زبانه‌ها: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- اسنپ‌شات/نماگرفت: `GET /snapshot`, `POST /screenshot`
- کنش‌ها: `POST /navigate`, `POST /act`
- قلاب‌ها: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- دانلودها: `POST /download`, `POST /wait/download`
- مجوزها: `POST /permissions/grant`
- اشکال‌زدایی: `GET /console`, `POST /pdf`
- اشکال‌زدایی: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- شبکه: `POST /response/body`
- وضعیت: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- وضعیت: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- تنظیمات: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

همه endpointها `?profile=<name>` را می‌پذیرند. `POST /start?headless=true` برای پروفایل‌های محلی مدیریت‌شده، یک
راه‌اندازی headless تک‌باره درخواست می‌کند، بدون اینکه پیکربندی پایدار
مرورگر را تغییر دهد؛ پروفایل‌های فقط-اتصال، CDP راه‌دور، و نشست موجود
این override را رد می‌کنند، چون OpenClaw آن فرایندهای مرورگر را راه‌اندازی نمی‌کند.

اگر احراز هویت Gateway با secret مشترک پیکربندی شده باشد، مسیرهای HTTP مرورگر هم به احراز هویت نیاز دارند:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` یا احراز هویت HTTP Basic با همان گذرواژه

نکته‌ها:

- این API مستقل مرورگر روی loopback، سرآیندهای هویت trusted-proxy یا
  Tailscale Serve را مصرف **نمی‌کند**.
- اگر `gateway.auth.mode` برابر `none` یا `trusted-proxy` باشد، این مسیرهای مرورگر روی loopback
  آن حالت‌های حامل هویت را به ارث نمی‌برند؛ آن‌ها را فقط روی loopback نگه دارید.

### قرارداد خطای `/act`

`POST /act` برای اعتبارسنجی سطح مسیر و
خرابی‌های سیاست، از پاسخ خطای ساختاریافته استفاده می‌کند:

```json
{ "error": "<message>", "code": "ACT_*" }
```

مقادیر فعلی `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` وجود ندارد یا شناخته‌شده نیست.
- `ACT_INVALID_REQUEST` (HTTP 400): payload کنش در نرمال‌سازی یا اعتبارسنجی شکست خورده است.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` با نوع کنشی استفاده شده که پشتیبانی نمی‌شود.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (یا `wait --fn`) با پیکربندی غیرفعال شده است.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` سطح بالا یا دسته‌ای با هدف درخواست تعارض دارد.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): کنش برای پروفایل‌های نشست موجود پشتیبانی نمی‌شود.

خرابی‌های دیگر زمان اجرا ممکن است همچنان `{ "error": "<message>" }` را بدون فیلد
`code` برگردانند.

### نیازمندی Playwright

برخی قابلیت‌ها (navigate/act/اسنپ‌شات AI/اسنپ‌شات نقش، نماگرفت‌های عنصر،
PDF) به Playwright نیاز دارند. اگر Playwright نصب نباشد، آن endpointها
یک خطای روشن 501 برمی‌گردانند.

مواردی که بدون Playwright همچنان کار می‌کنند:

- اسنپ‌شات‌های ARIA
- اسنپ‌شات‌های دسترس‌پذیری سبک نقش (`--interactive`, `--compact`,
  `--depth`, `--efficient`) وقتی WebSocket مربوط به CDP برای هر زبانه در دسترس باشد. این
  یک fallback برای بازرسی و کشف ref است؛ Playwright همچنان موتور اصلی
  کنش باقی می‌ماند.
- نماگرفت‌های صفحه برای مرورگر مدیریت‌شده `openclaw` وقتی WebSocket مربوط به CDP
  برای هر زبانه در دسترس باشد
- نماگرفت‌های صفحه برای پروفایل‌های `existing-session` / Chrome MCP
- نماگرفت‌های مبتنی بر ref در `existing-session` (`--ref`) از خروجی اسنپ‌شات

مواردی که همچنان به Playwright نیاز دارند:

- `navigate`
- `act`
- اسنپ‌شات‌های AI که به قالب اسنپ‌شات AI بومی Playwright وابسته‌اند
- نماگرفت‌های عنصر با CSS-selector (`--element`)
- خروجی‌گیری PDF کامل مرورگر

نماگرفت‌های عنصر، `--full-page` را هم رد می‌کنند؛ مسیر این را برمی‌گرداند: `fullPage is
not supported for element screenshots`.

اگر `Playwright is not available in this gateway build` را می‌بینید، Gateway بسته‌بندی‌شده
وابستگی اصلی runtime مرورگر را ندارد. OpenClaw را دوباره نصب یا به‌روزرسانی کنید،
سپس gateway را دوباره راه‌اندازی کنید. برای Docker، باینری‌های مرورگر Chromium
را نیز همان‌طور که در ادامه نشان داده شده نصب کنید.

#### نصب Docker Playwright

اگر Gateway شما در Docker اجرا می‌شود، از `npx playwright` پرهیز کنید (تعارض‌های override در npm).
به‌جای آن از CLI همراه بسته استفاده کنید:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

برای پایدار نگه داشتن دانلودهای مرورگر، `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید (برای مثال،
`/home/node/.cache/ms-playwright`) و مطمئن شوید `/home/node` از طریق
`OPENCLAW_HOME_VOLUME` یا bind mount پایدار شده است. OpenClaw به‌طور خودکار
Chromium پایدارشده را روی Linux تشخیص می‌دهد. [Docker](/fa/install/docker) را ببینید.

## نحوه کارکرد (داخلی)

یک سرور کنترل کوچک روی loopback درخواست‌های HTTP را می‌پذیرد و از طریق CDP به مرورگرهای مبتنی بر Chromium وصل می‌شود. کنش‌های پیشرفته (click/type/snapshot/PDF) از طریق Playwright روی CDP انجام می‌شوند؛ وقتی Playwright وجود نداشته باشد، فقط عملیات غیر Playwright در دسترس است. عامل یک رابط پایدار می‌بیند، در حالی که مرورگرها و پروفایل‌های محلی/راه‌دور آزادانه در زیر آن جابه‌جا می‌شوند.

## مرجع سریع CLI

همه فرمان‌ها `--browser-profile <name>` را برای هدف‌گیری یک پروفایل مشخص، و `--json` را برای خروجی قابل خواندن توسط ماشین می‌پذیرند.

<AccordionGroup>

<Accordion title="Basics: status, tabs, open/focus/close">

```bash
openclaw browser status
openclaw browser start
openclaw browser start --headless # one-shot local managed headless launch
openclaw browser stop            # also clears emulation on attach-only/remote CDP
openclaw browser tabs
openclaw browser tab             # shortcut for current tab
openclaw browser tab new
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="Inspection: screenshot, snapshot, console, errors, requests">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # or --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="Actions: navigate, click, type, drag, wait, evaluate">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # or e12 for role refs
openclaw browser click-coords 120 340        # viewport coordinates
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser highlight e12
openclaw browser trace start
openclaw browser trace stop
```

</Accordion>

<Accordion title="State: cookies, storage, offline, headers, geo, device">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # --clear to remove
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

نکته‌ها:

- `upload` و `dialog` فراخوانی‌های **آماده‌سازی** هستند؛ آن‌ها را پیش از click/pressی اجرا کنید که chooser/dialog را فعال می‌کند.
- `click`/`type`/و غیره به یک `ref` از `snapshot` نیاز دارند (`12` عددی، ref نقش `e12`، یا ref کنش‌پذیر ARIA با `ax12`). CSS selectorها عمدا برای کنش‌ها پشتیبانی نمی‌شوند. وقتی موقعیت نمایان viewport تنها هدف قابل اتکاست، از `click-coords` استفاده کنید.
- مسیرهای دانلود، trace، و upload به ریشه‌های موقت OpenClaw محدودند: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` همچنین می‌تواند file inputها را مستقیما از طریق `--input-ref` یا `--element` تنظیم کند.

شناسه‌ها و برچسب‌های پایدار زبانه‌ها پس از جایگزینی raw-target در Chromium باقی می‌مانند، وقتی OpenClaw
بتواند زبانه جایگزین را اثبات کند؛ مثلا URL یکسان یا تبدیل شدن یک زبانه قدیمی
به یک زبانه جدید پس از ارسال فرم. شناسه‌های raw target همچنان ناپایدارند؛ در
اسکریپت‌ها `suggestedTargetId` از `tabs` را ترجیح دهید.

نگاه سریع به flagهای اسنپ‌شات:

- `--format ai` (پیش‌فرض با Playwright): اسنپ‌شات AI با refهای عددی (`aria-ref="<n>"`).
- `--format aria`: درخت دسترس‌پذیری با refهای `axN`. وقتی Playwright در دسترس باشد، OpenClaw refها را با backend DOM idها به صفحه زنده bind می‌کند تا کنش‌های بعدی بتوانند از آن‌ها استفاده کنند؛ در غیر این صورت خروجی را فقط برای بازرسی در نظر بگیرید.
- `--efficient` (یا `--mode efficient`): preset فشرده اسنپ‌شات نقش. برای پیش‌فرض کردن این حالت، `browser.snapshotDefaults.mode: "efficient"` را تنظیم کنید ([پیکربندی Gateway](/fa/gateway/configuration-reference#browser) را ببینید).
- `--interactive`, `--compact`, `--depth`, `--selector` یک اسنپ‌شات نقش با refهای `ref=e12` را اجبار می‌کنند. `--frame "<iframe>"` دامنه اسنپ‌شات‌های نقش را به یک iframe محدود می‌کند.
- `--labels` یک نماگرفت فقط از viewport با برچسب‌های ref هم‌پوشانی‌شده اضافه می‌کند (`MEDIA:<path>` را چاپ می‌کند).
- `--urls` مقصدهای لینک کشف‌شده را به اسنپ‌شات‌های AI اضافه می‌کند.

## اسنپ‌شات‌ها و refs

OpenClaw از دو سبک «اسنپ‌شات» پشتیبانی می‌کند:

- **اسنپ‌شات AI (refهای عددی)**: `openclaw browser snapshot` (پیش‌فرض؛ `--format ai`)
  - خروجی: یک اسنپ‌شات متنی که شامل refهای عددی است.
  - کنش‌ها: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - در داخل، ref از طریق `aria-ref` مربوط به Playwright resolve می‌شود.

- **اسنپ‌شات نقش (refهای نقش مانند `e12`)**: `openclaw browser snapshot --interactive` (یا `--compact`, `--depth`, `--selector`, `--frame`)
  - خروجی: یک فهرست/درخت مبتنی بر نقش با `[ref=e12]` (و `[nth=1]` اختیاری).
  - کنش‌ها: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - در داخل، ref از طریق `getByRole(...)` resolve می‌شود (به‌علاوه `nth()` برای موارد تکراری).
  - برای افزودن یک نماگرفت viewport با برچسب‌های `e12` هم‌پوشانی‌شده، `--labels` را اضافه کنید.
  - وقتی متن لینک مبهم است و عامل به هدف‌های ناوبری مشخص نیاز دارد،
    `--urls` را اضافه کنید.

- **اسنپ‌شات ARIA (refهای ARIA مانند `ax12`)**: `openclaw browser snapshot --format aria`
  - خروجی: درخت دسترس‌پذیری به‌شکل nodeهای ساختاریافته.
  - کنش‌ها: `openclaw browser click ax12` وقتی مسیر اسنپ‌شات بتواند
    ref را از طریق Playwright و backend DOM idهای Chrome bind کند کار می‌کند.
- اگر Playwright در دسترس نباشد، اسنپ‌شات‌های ARIA همچنان می‌توانند برای
  بازرسی مفید باشند، اما refها ممکن است کنش‌پذیر نباشند. وقتی به refهای کنشی نیاز دارید،
  با `--format ai`
  یا `--interactive` دوباره اسنپ‌شات بگیرید.
- اثبات Docker برای مسیر fallback خام-CDP: `pnpm test:docker:browser-cdp-snapshot`
  Chromium را با CDP شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند که اسنپ‌شات‌های نقش
  شامل URLهای لینک، موارد قابل کلیک ارتقایافته با cursor، و فراداده iframe باشند.

رفتار ref:

- Refها **در پیمایش‌ها پایدار نیستند**؛ اگر چیزی شکست خورد، `snapshot` را دوباره اجرا کنید و از ref تازه استفاده کنید.
- `/act` پس از جایگزینیِ ناشی از اقدام، وقتی بتواند تب جایگزین را اثبات کند،
  `targetId` خام فعلی را برمی‌گرداند. برای فرمان‌های بعدی همچنان از شناسه‌ها/برچسب‌های پایدار تب استفاده کنید.
- اگر snapshot نقش با `--frame` گرفته شده باشد، refهای نقش تا snapshot نقش بعدی به همان iframe محدود می‌مانند.
- Refهای ناشناخته یا کهنه‌ی `axN` سریع شکست می‌خورند، به‌جای اینکه به
  گزینشگر `aria-ref` در Playwright سرریز شوند. وقتی این اتفاق افتاد، روی همان تب یک snapshot تازه بگیرید.

## قابلیت‌های پیشرفته‌ی انتظار

می‌توانید فقط منتظر زمان/متن نمانید:

- انتظار برای URL (globهای پشتیبانی‌شده توسط Playwright):
  - `openclaw browser wait --url "**/dash"`
- انتظار برای وضعیت بارگذاری:
  - `openclaw browser wait --load networkidle`
- انتظار برای یک گزاره‌ی JS:
  - `openclaw browser wait --fn "window.ready===true"`
- انتظار برای نمایان شدن یک گزینشگر:
  - `openclaw browser wait "#main"`

این‌ها را می‌توان ترکیب کرد:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## گردش‌کارهای اشکال‌زدایی

وقتی یک اقدام شکست می‌خورد (برای مثال «نمایان نیست»، «نقض strict mode»، «پوشانده شده»):

1. `openclaw browser snapshot --interactive`
2. از `click <ref>` / `type <ref>` استفاده کنید (در حالت تعاملی، refهای نقش را ترجیح دهید)
3. اگر هنوز شکست می‌خورد: `openclaw browser highlight <ref>` تا ببینید Playwright چه چیزی را هدف گرفته است
4. اگر صفحه رفتار عجیبی دارد:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. برای اشکال‌زدایی عمیق: یک trace ضبط کنید:
   - `openclaw browser trace start`
   - مشکل را بازتولید کنید
   - `openclaw browser trace stop` (`TRACE:<path>` را چاپ می‌کند)

## خروجی JSON

`--json` برای اسکریپت‌نویسی و ابزارهای ساختاریافته است.

مثال‌ها:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Snapshotهای نقش در JSON شامل `refs` به‌همراه یک بلوک کوچک `stats` (lines/chars/refs/interactive) هستند تا ابزارها بتوانند درباره‌ی اندازه و تراکم payload استدلال کنند.

## وضعیت و تنظیمات محیط

این‌ها برای گردش‌کارهای «کاری کن سایت مثل X رفتار کند» مفیدند:

- کوکی‌ها: `cookies`، `cookies set`، `cookies clear`
- ذخیره‌سازی: `storage local|session get|set|clear`
- آفلاین: `set offline on|off`
- سربرگ‌ها: `set headers --headers-json '{"X-Debug":"1"}'` (`set headers --json '{"X-Debug":"1"}'` قدیمی همچنان پشتیبانی می‌شود)
- احراز هویت پایه‌ی HTTP: `set credentials user pass` (یا `--clear`)
- موقعیت جغرافیایی: `set geo <lat> <lon> --origin "https://example.com"` (یا `--clear`)
- رسانه: `set media dark|light|no-preference|none`
- منطقه‌ی زمانی / locale: `set timezone ...`، `set locale ...`
- دستگاه / viewport:
  - `set device "iPhone 14"` (پیش‌تنظیم‌های دستگاه در Playwright)
  - `set viewport 1280 720`

## امنیت و حریم خصوصی

- پروفایل مرورگر openclaw ممکن است نشست‌های واردشده داشته باشد؛ با آن به‌عنوان داده‌ی حساس رفتار کنید.
- `browser act kind=evaluate` / `openclaw browser evaluate` و `wait --fn`
  JavaScript دلخواه را در زمینه‌ی صفحه اجرا می‌کنند. prompt injection می‌تواند
  این را هدایت کند. اگر به آن نیاز ندارید، با `browser.evaluateEnabled=false` غیرفعالش کنید.
- برای ورودها و نکات ضدبات (X/Twitter و غیره)، [ورود مرورگر + ارسال در X/Twitter](/fa/tools/browser-login) را ببینید.
- میزبان Gateway/Node را خصوصی نگه دارید (لوپ‌بک یا فقط tailnet).
- endpointهای CDP از راه دور قدرتمندند؛ آن‌ها را تونل کنید و محافظت کنید.

نمونه‌ی strict-mode (مسیرهای خصوصی/داخلی را به‌صورت پیش‌فرض مسدود کنید):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // optional exact allow
    },
  },
}
```

## مرتبط

- [مرورگر](/fa/tools/browser) - نمای کلی، پیکربندی، پروفایل‌ها، امنیت
- [ورود مرورگر](/fa/tools/browser-login) - ورود به سایت‌ها
- [عیب‌یابی مرورگر در Linux](/fa/tools/browser-linux-troubleshooting)
- [عیب‌یابی مرورگر در WSL2](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
