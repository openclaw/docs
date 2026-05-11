---
read_when:
    - اسکریپت‌نویسی یا اشکال‌زدایی مرورگر عامل از طریق رابط برنامه‌نویسی کاربردی کنترل محلی
    - در جست‌وجوی مرجع CLI `openclaw browser`
    - افزودن خودکارسازی سفارشی مرورگر با اسنپ‌شات‌ها و ارجاع‌ها
summary: رابط برنامه‌نویسی کنترل مرورگر OpenClaw، مرجع CLI و اقدام‌های اسکریپت‌نویسی
title: رابط برنامه‌نویسی کاربردی کنترل مرورگر
x-i18n:
    generated_at: "2026-05-11T20:44:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 317ac82cb9060ae1f9495a992dcbb25356ef23b98a5802cf0ed65d1720c2a57d
    source_path: tools/browser-control.md
    workflow: 16
---

برای راه‌اندازی، پیکربندی، و عیب‌یابی، [Browser](/fa/tools/browser) را ببینید.
این صفحه مرجع API محلی کنترل HTTP، CLI مربوط به `openclaw browser`،
و الگوهای اسکریپت‌نویسی (snapshotها، refها، waitها، جریان‌های debug) است.

## API کنترل (اختیاری)

فقط برای یکپارچه‌سازی‌های محلی، Gateway یک API کوچک HTTP روی loopback ارائه می‌کند:

- وضعیت/شروع/توقف: `GET /`, `POST /start`, `POST /stop`
- تب‌ها: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- کنش‌ها: `POST /navigate`, `POST /act`
- Hookها: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- دانلودها: `POST /download`, `POST /wait/download`
- مجوزها: `POST /permissions/grant`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- شبکه: `POST /response/body`
- وضعیت: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- وضعیت: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- تنظیمات: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

همه endpointها `?profile=<name>` را می‌پذیرند. `POST /start?headless=true` برای
profileهای محلی مدیریت‌شده، یک اجرای headless یک‌باره درخواست می‌کند، بدون اینکه
پیکربندی ماندگار مرورگر را تغییر دهد؛ profileهای attach-only، remote CDP، و
existing-session این override را رد می‌کنند، چون OpenClaw آن فرایندهای مرورگر را اجرا نمی‌کند.

اگر احراز هویت Gateway با shared-secret پیکربندی شده باشد، routeهای HTTP مرورگر نیز به احراز هویت نیاز دارند:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` یا احراز هویت HTTP Basic با همان گذرواژه

نکته‌ها:

- این API مستقل loopback مرورگر، headerهای هویت trusted-proxy یا
  Tailscale Serve را مصرف **نمی‌کند**.
- اگر `gateway.auth.mode` برابر `none` یا `trusted-proxy` باشد، این routeهای loopback مرورگر
  آن modeهای دارای هویت را به ارث نمی‌برند؛ آن‌ها را فقط loopback نگه دارید.

### قرارداد خطای `/act`

`POST /act` برای اعتبارسنجی در سطح route و شکست‌های policy از پاسخ خطای ساختاریافته استفاده می‌کند:

```json
{ "error": "<message>", "code": "ACT_*" }
```

مقادیر فعلی `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` وجود ندارد یا شناسایی نشده است.
- `ACT_INVALID_REQUEST` (HTTP 400): payload کنش در normalizing یا اعتبارسنجی شکست خورد.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` با نوع کنش پشتیبانی‌نشده استفاده شده است.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (یا `wait --fn`) توسط config غیرفعال شده است.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` سطح‌بالا یا batched با target درخواست تعارض دارد.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): کنش برای profileهای existing-session پشتیبانی نمی‌شود.

شکست‌های runtime دیگر ممکن است همچنان بدون فیلد
`code` مقدار `{ "error": "<message>" }` را برگردانند.

### نیازمندی Playwright

برخی قابلیت‌ها (navigate/act/snapshot هوش مصنوعی/snapshot نقش، screenshotهای element،
PDF) به Playwright نیاز دارند. اگر Playwright نصب نباشد، آن endpointها
یک خطای 501 روشن برمی‌گردانند.

چیزهایی که بدون Playwright همچنان کار می‌کنند:

- snapshotهای ARIA
- snapshotهای دسترس‌پذیری سبک نقش (`--interactive`, `--compact`,
  `--depth`, `--efficient`) وقتی WebSocket مربوط به CDP هر تب در دسترس باشد. این یک
  fallback برای بازرسی و کشف ref است؛ Playwright همچنان موتور اصلی
  کنش است.
- screenshotهای صفحه برای مرورگر مدیریت‌شده `openclaw` وقتی CDP
  WebSocket هر تب در دسترس باشد
- screenshotهای صفحه برای profileهای `existing-session` / Chrome MCP
- screenshotهای مبتنی بر ref مربوط به `existing-session` (`--ref`) از خروجی snapshot

چیزهایی که همچنان به Playwright نیاز دارند:

- `navigate`
- `act`
- snapshotهای هوش مصنوعی که به قالب snapshot هوش مصنوعی بومی Playwright وابسته‌اند
- screenshotهای element با CSS-selector (`--element`)
- خروجی PDF کامل مرورگر

screenshotهای element همچنین `--full-page` را رد می‌کنند؛ route مقدار `fullPage is
not supported for element screenshots` را برمی‌گرداند.

اگر `Playwright is not available in this gateway build` را دیدید، Gateway بسته‌بندی‌شده
وابستگی runtime اصلی مرورگر را ندارد. OpenClaw را دوباره نصب یا به‌روزرسانی کنید،
سپس gateway را restart کنید. برای Docker، binaryهای مرورگر Chromium را نیز
طبق پایین نصب کنید.

#### نصب Docker Playwright

اگر Gateway شما در Docker اجرا می‌شود، از `npx playwright` پرهیز کنید (تعارض‌های npm override).
برای imageهای سفارشی، Chromium را داخل image bake کنید:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

برای یک image موجود، به‌جای آن از طریق CLI همراه نصب کنید:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

برای ماندگار کردن دانلودهای مرورگر، `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید (برای نمونه،
`/home/node/.cache/ms-playwright`) و مطمئن شوید `/home/node` از طریق
`OPENCLAW_HOME_VOLUME` یا یک bind mount ماندگار شده است. OpenClaw روی Linux،
Chromium ماندگارشده را به‌طور خودکار تشخیص می‌دهد. [Docker](/fa/install/docker) را ببینید.

## نحوه کارکرد (داخلی)

یک سرور کنترل کوچک loopback درخواست‌های HTTP را می‌پذیرد و از طریق CDP به مرورگرهای مبتنی بر Chromium وصل می‌شود. کنش‌های پیشرفته (click/type/snapshot/PDF) روی CDP از طریق Playwright انجام می‌شوند؛ وقتی Playwright وجود ندارد، فقط عملیات غیر Playwright در دسترس‌اند. عامل یک رابط پایدار می‌بیند، در حالی که مرورگرها و profileهای محلی/remote در لایه زیرین آزادانه جابه‌جا می‌شوند.

## مرجع سریع CLI

همه commandها برای هدف‌گیری یک profile مشخص، `--browser-profile <name>` را می‌پذیرند، و برای خروجی قابل خواندن توسط ماشین، `--json` را می‌پذیرند.

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

- `upload` و `dialog` فراخوانی‌های **arming** هستند؛ آن‌ها را پیش از click/pressای اجرا کنید که chooser/dialog را trigger می‌کند.
- `click`/`type`/etc به یک `ref` از `snapshot` نیاز دارند (`12` عددی، role ref به شکل `e12`، یا ARIA ref قابل اقدام به شکل `ax12`). CSS selectorها عمدا برای کنش‌ها پشتیبانی نمی‌شوند. وقتی موقعیت قابل مشاهده viewport تنها target قابل اتکاست، از `click-coords` استفاده کنید.
- مسیرهای دانلود، trace، و upload به ریشه‌های temp مربوط به OpenClaw محدودند: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` همچنین می‌تواند از طریق `--input-ref` یا `--element`، file inputها را مستقیم تنظیم کند.

شناسه‌ها و برچسب‌های پایدار تب‌ها پس از جایگزینی raw-target در Chromium باقی می‌مانند، وقتی OpenClaw
بتواند تب جایگزین را اثبات کند؛ مثل URL یکسان یا تبدیل یک تب قدیمی به
یک تب جدید پس از ارسال فرم. شناسه‌های raw target همچنان ناپایدارند؛ در اسکریپت‌ها
`suggestedTargetId` از `tabs` را ترجیح دهید.

نگاهی سریع به flagهای snapshot:

- `--format ai` (پیش‌فرض همراه Playwright): snapshot هوش مصنوعی با refهای عددی (`aria-ref="<n>"`).
- `--format aria`: درخت دسترس‌پذیری با refهای `axN`. وقتی Playwright در دسترس باشد، OpenClaw refها را با backend DOM idها به صفحه زنده bind می‌کند تا کنش‌های بعدی بتوانند از آن‌ها استفاده کنند؛ در غیر این صورت خروجی را فقط برای بازرسی در نظر بگیرید.
- `--efficient` (یا `--mode efficient`): preset فشرده role snapshot. برای اینکه این حالت پیش‌فرض شود، `browser.snapshotDefaults.mode: "efficient"` را تنظیم کنید ([پیکربندی Gateway](/fa/gateway/configuration-reference#browser) را ببینید).
- `--interactive`, `--compact`, `--depth`, `--selector` یک role snapshot با refهای `ref=e12` را اجبار می‌کنند. `--frame "<iframe>"` role snapshotها را به یک iframe محدود می‌کند.
- `--labels` یک screenshot فقط viewport با برچسب‌های ref روی آن اضافه می‌کند (`MEDIA:<path>` را چاپ می‌کند).
- `--urls` مقصدهای link کشف‌شده را به snapshotهای هوش مصنوعی اضافه می‌کند.

## Snapshotها و refها

OpenClaw از دو سبک «snapshot» پشتیبانی می‌کند:

- **snapshot هوش مصنوعی (refهای عددی)**: `openclaw browser snapshot` (پیش‌فرض؛ `--format ai`)
  - خروجی: یک snapshot متنی که شامل refهای عددی است.
  - کنش‌ها: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - در داخل، ref از طریق `aria-ref` مربوط به Playwright resolve می‌شود.

- **Role snapshot (role refهایی مثل `e12`)**: `openclaw browser snapshot --interactive` (یا `--compact`, `--depth`, `--selector`, `--frame`)
  - خروجی: یک فهرست/درخت مبتنی بر نقش با `[ref=e12]` (و `[nth=1]` اختیاری).
  - کنش‌ها: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - در داخل، ref از طریق `getByRole(...)` (به‌علاوه `nth()` برای تکراری‌ها) resolve می‌شود.
  - برای افزودن یک screenshot از viewport با برچسب‌های `e12` روی آن، `--labels` را اضافه کنید.
  - وقتی متن link مبهم است و عامل به targetهای مشخص
    ناوبری نیاز دارد، `--urls` را اضافه کنید.

- **تصویر لحظه‌ای ARIA (ارجاع‌های ARIA مانند `ax12`)**: `openclaw browser snapshot --format aria`
  - خروجی: درخت دسترس‌پذیری به‌صورت گره‌های ساختاریافته.
  - کنش‌ها: `openclaw browser click ax12` زمانی کار می‌کند که مسیر تصویر لحظه‌ای بتواند
    ارجاع را از طریق شناسه‌های DOM در backend مربوط به Playwright و Chrome متصل کند.
- اگر Playwright در دسترس نباشد، تصویرهای لحظه‌ای ARIA همچنان می‌توانند برای
  بازرسی مفید باشند، اما ممکن است ارجاع‌ها قابل اجرا نباشند. وقتی به ارجاع‌های کنش نیاز دارید،
  با `--format ai` یا `--interactive` دوباره تصویر لحظه‌ای بگیرید.
- اثبات Docker برای مسیر جایگزین CDP خام: `pnpm test:docker:browser-cdp-snapshot`
  Chromium را با CDP اجرا می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند که
  تصویرهای لحظه‌ای نقش شامل URLهای پیوند، عناصر قابل کلیک ارتقایافته با نشانگر، و فراداده iframe باشند.

رفتار ارجاع:

- ارجاع‌ها **در ناوبری‌ها پایدار نیستند**؛ اگر چیزی شکست خورد، `snapshot` را دوباره اجرا کنید و از یک ارجاع تازه استفاده کنید.
- `/act` پس از جایگزینیِ آغازشده توسط کنش، وقتی بتواند زبانه جایگزین را اثبات کند،
  `targetId` خام فعلی را برمی‌گرداند. برای دستورهای بعدی همچنان از شناسه‌ها/برچسب‌های پایدار زبانه استفاده کنید.
- اگر تصویر لحظه‌ای نقش با `--frame` گرفته شده باشد، ارجاع‌های نقش تا تصویر لحظه‌ای نقش بعدی به همان iframe محدود می‌مانند.
- ارجاع‌های ناشناخته یا منقضی‌شده `axN` به‌جای افتادن به selector مربوط به
  `aria-ref` در Playwright، سریع شکست می‌خورند. وقتی این اتفاق افتاد، روی همان زبانه یک تصویر لحظه‌ای تازه بگیرید.

## قابلیت‌های پیشرفته انتظار

می‌توانید فقط برای زمان/متن منتظر نمانید:

- انتظار برای URL (globهای پشتیبانی‌شده توسط Playwright):
  - `openclaw browser wait --url "**/dash"`
- انتظار برای وضعیت بارگذاری:
  - `openclaw browser wait --load networkidle`
- انتظار برای یک predicate جاوااسکریپت:
  - `openclaw browser wait --fn "window.ready===true"`
- انتظار برای اینکه یک selector قابل مشاهده شود:
  - `openclaw browser wait "#main"`

این‌ها را می‌توان با هم ترکیب کرد:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## گردش‌کارهای اشکال‌زدایی

وقتی یک کنش شکست می‌خورد (مثلاً «قابل مشاهده نیست»، «نقض حالت سخت‌گیرانه»، «پوشانده شده»):

1. `openclaw browser snapshot --interactive`
2. از `click <ref>` / `type <ref>` استفاده کنید (در حالت تعاملی، ارجاع‌های نقش را ترجیح دهید)
3. اگر همچنان شکست خورد: `openclaw browser highlight <ref>` تا ببینید Playwright چه چیزی را هدف گرفته است
4. اگر صفحه رفتار عجیبی داشت:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. برای اشکال‌زدایی عمیق: یک trace ضبط کنید:
   - `openclaw browser trace start`
   - مشکل را بازتولید کنید
   - `openclaw browser trace stop` (`TRACE:<path>` را چاپ می‌کند)

## خروجی JSON

`--json` برای اسکریپت‌نویسی و ابزارهای ساختاریافته است.

نمونه‌ها:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

تصویرهای لحظه‌ای نقش در JSON شامل `refs` به‌همراه یک بلوک کوچک `stats` هستند (lines/chars/refs/interactive)، تا ابزارها بتوانند درباره اندازه و تراکم payload استدلال کنند.

## کنترل‌های وضعیت و محیط

این‌ها برای گردش‌کارهای «سایت را مثل X رفتار بده» مفید هستند:

- کوکی‌ها: `cookies`, `cookies set`, `cookies clear`
- ذخیره‌سازی: `storage local|session get|set|clear`
- آفلاین: `set offline on|off`
- سرآیندها: `set headers --headers-json '{"X-Debug":"1"}'` (`set headers --json '{"X-Debug":"1"}'` قدیمی همچنان پشتیبانی می‌شود)
- احراز هویت پایه HTTP: `set credentials user pass` (یا `--clear`)
- مکان جغرافیایی: `set geo <lat> <lon> --origin "https://example.com"` (یا `--clear`)
- رسانه: `set media dark|light|no-preference|none`
- منطقه زمانی / locale: `set timezone ...`, `set locale ...`
- دستگاه / viewport:
  - `set device "iPhone 14"` (presetهای دستگاه در Playwright)
  - `set viewport 1280 720`

## امنیت و حریم خصوصی

- پروفایل مرورگر openclaw ممکن است شامل نشست‌های واردشده باشد؛ آن را حساس تلقی کنید.
- `browser act kind=evaluate` / `openclaw browser evaluate` و `wait --fn`
  جاوااسکریپت دلخواه را در context صفحه اجرا می‌کنند. تزریق prompt می‌تواند
  این را هدایت کند. اگر به آن نیاز ندارید، با `browser.evaluateEnabled=false` غیرفعالش کنید.
- برای نکات ورود و ضدربات (X/Twitter و غیره)، [ورود مرورگر + ارسال در X/Twitter](/fa/tools/browser-login) را ببینید.
- میزبان Gateway/Node را خصوصی نگه دارید (local loopback یا فقط tailnet).
- endpointهای CDP راه دور قدرتمند هستند؛ آن‌ها را تونل و محافظت کنید.

نمونه حالت سخت‌گیرانه (مقصدهای خصوصی/داخلی را به‌طور پیش‌فرض مسدود کنید):

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
- [عیب‌یابی Browser در Linux](/fa/tools/browser-linux-troubleshooting)
- [عیب‌یابی Browser در WSL2](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
