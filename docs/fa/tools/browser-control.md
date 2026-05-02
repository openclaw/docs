---
read_when:
    - اسکریپت‌نویسی یا اشکال‌زدایی مرورگر عامل از طریق API کنترل محلی
    - به دنبال مرجع CLI ‏`openclaw browser` هستید
    - افزودن خودکارسازی سفارشی مرورگر با اسنپ‌شات‌ها و ارجاع‌ها
summary: رابط برنامه‌نویسی کنترل مرورگر OpenClaw، مرجع CLI، و کنش‌های اسکریپت‌نویسی
title: رابط برنامه‌نویسی کنترل مرورگر
x-i18n:
    generated_at: "2026-05-02T12:04:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef996319c09bfa8de9b5c3a340c68496ac3698295b62f4f07c79f3e233eda2a2
    source_path: tools/browser-control.md
    workflow: 16
---

برای راه‌اندازی، پیکربندی، و عیب‌یابی، [Browser](/fa/tools/browser) را ببینید.
این صفحه مرجع API کنترل HTTP محلی، CLI `openclaw browser`، و الگوهای اسکریپت‌نویسی (snapshotها، refها، waitها، جریان‌های اشکال‌زدایی) است.

## API کنترل (اختیاری)

فقط برای یکپارچه‌سازی‌های محلی، Gateway یک API کوچک HTTP روی loopback ارائه می‌کند:

- وضعیت/شروع/توقف: `GET /`, `POST /start`, `POST /stop`
- تب‌ها: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/اسکرین‌شات: `GET /snapshot`, `POST /screenshot`
- اقدام‌ها: `POST /navigate`, `POST /act`
- Hookها: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- دانلودها: `POST /download`, `POST /wait/download`
- مجوزها: `POST /permissions/grant`
- اشکال‌زدایی: `GET /console`, `POST /pdf`
- اشکال‌زدایی: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- شبکه: `POST /response/body`
- وضعیت: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- وضعیت: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- تنظیمات: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

همه endpointها `?profile=<name>` را می‌پذیرند. `POST /start?headless=true` برای profileهای محلی مدیریت‌شده، یک اجرای headless یک‌باره درخواست می‌کند بدون اینکه پیکربندی پایدار مرورگر را تغییر دهد؛ profileهای attach-only، remote CDP، و existing-session این override را رد می‌کنند، چون OpenClaw آن فرایندهای مرورگر را اجرا نمی‌کند.

اگر احراز هویت Gateway با secret مشترک پیکربندی شده باشد، routeهای HTTP مرورگر هم به احراز هویت نیاز دارند:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` یا احراز هویت HTTP Basic با همان گذرواژه

نکته‌ها:

- این API مستقل loopback مرورگر، headerهای هویت trusted-proxy یا Tailscale Serve را مصرف نمی‌کند.
- اگر `gateway.auth.mode` برابر `none` یا `trusted-proxy` باشد، این routeهای loopback مرورگر آن حالت‌های حامل هویت را به ارث نمی‌برند؛ آن‌ها را فقط روی loopback نگه دارید.

### قرارداد خطای `/act`

`POST /act` برای اعتبارسنجی سطح route و شکست‌های policy از پاسخ خطای ساختاریافته استفاده می‌کند:

```json
{ "error": "<message>", "code": "ACT_*" }
```

مقادیر فعلی `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` وجود ندارد یا شناخته نشده است.
- `ACT_INVALID_REQUEST` (HTTP 400): payload اقدام در normalizing یا validation شکست خورد.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` با نوع اقدامی استفاده شد که پشتیبانی نمی‌شود.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (یا `wait --fn`) توسط پیکربندی غیرفعال است.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` سطح بالا یا batch‌شده با target درخواست تعارض دارد.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): اقدام برای profileهای existing-session پشتیبانی نمی‌شود.

شکست‌های runtime دیگر ممکن است همچنان بدون فیلد `code`، `{ "error": "<message>" }` برگردانند.

### نیازمندی Playwright

بعضی قابلیت‌ها (navigate/act/AI snapshot/role snapshot، اسکرین‌شات عنصر، PDF) به Playwright نیاز دارند. اگر Playwright نصب نباشد، آن endpointها یک خطای واضح 501 برمی‌گردانند.

آنچه بدون Playwright همچنان کار می‌کند:

- snapshotهای ARIA
- snapshotهای دسترسی‌پذیری به سبک نقش (`--interactive`, `--compact`,
  `--depth`, `--efficient`) وقتی WebSocket مربوط به CDP هر تب در دسترس باشد. این یک fallback برای بازرسی و کشف ref است؛ Playwright همچنان موتور اصلی اقدام‌هاست.
- اسکرین‌شات‌های صفحه برای مرورگر مدیریت‌شده `openclaw` وقتی WebSocket مربوط به CDP هر تب در دسترس باشد
- اسکرین‌شات‌های صفحه برای profileهای `existing-session` / Chrome MCP
- اسکرین‌شات‌های مبتنی بر ref در `existing-session` (`--ref`) از خروجی snapshot

آنچه همچنان به Playwright نیاز دارد:

- `navigate`
- `act`
- snapshotهای AI که به قالب snapshot بومی AI در Playwright وابسته‌اند
- اسکرین‌شات‌های عنصر با CSS-selector (`--element`)
- خروجی PDF کامل مرورگر

اسکرین‌شات‌های عنصر همچنین `--full-page` را رد می‌کنند؛ route مقدار `fullPage is
not supported for element screenshots` را برمی‌گرداند.

اگر `Playwright is not available in this gateway build` را دیدید، Gateway بسته‌بندی‌شده dependency اصلی runtime مرورگر را ندارد. OpenClaw را دوباره نصب یا به‌روزرسانی کنید، سپس Gateway را restart کنید. برای Docker، باینری‌های مرورگر Chromium را نیز همان‌طور که پایین نشان داده شده نصب کنید.

#### نصب Docker Playwright

اگر Gateway شما در Docker اجرا می‌شود، از `npx playwright` استفاده نکنید (تعارض‌های npm override). به‌جای آن از CLI bundled استفاده کنید:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

برای پایدار نگه داشتن دانلودهای مرورگر، `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید (برای مثال، `/home/node/.cache/ms-playwright`) و مطمئن شوید `/home/node` از طریق `OPENCLAW_HOME_VOLUME` یا یک bind mount پایدار می‌ماند. [Docker](/fa/install/docker) را ببینید.

## سازوکار (داخلی)

یک سرور کنترل loopback کوچک درخواست‌های HTTP را می‌پذیرد و از طریق CDP به مرورگرهای مبتنی بر Chromium وصل می‌شود. اقدام‌های پیشرفته (click/type/snapshot/PDF) از طریق Playwright روی CDP انجام می‌شوند؛ وقتی Playwright وجود نداشته باشد، فقط عملیات غیر Playwright در دسترس است. عامل یک interface پایدار می‌بیند، در حالی که مرورگرها و profileهای local/remote آزادانه در زیر آن جابه‌جا می‌شوند.

## مرجع سریع CLI

همه فرمان‌ها برای هدف گرفتن یک profile مشخص، `--browser-profile <name>`، و برای خروجی قابل خواندن توسط ماشین، `--json` را می‌پذیرند.

<AccordionGroup>

<Accordion title="مبانی: وضعیت، تب‌ها، باز کردن/فوکوس/بستن">

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

<Accordion title="بازرسی: اسکرین‌شات، snapshot، console، errors، requests">

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

<Accordion title="اقدام‌ها: navigate، click، type، drag، wait، evaluate">

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

<Accordion title="وضعیت: cookies، storage، offline، headers، geo، device">

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

- `upload` و `dialog` فراخوانی‌های **arming** هستند؛ آن‌ها را پیش از click/press که chooser/dialog را trigger می‌کند اجرا کنید.
- `click`/`type`/و غیره به یک `ref` از `snapshot` نیاز دارند (عدد `12`، role ref `e12`، یا actionable ARIA ref `ax12`). CSS selectorها عمدا برای actionها پشتیبانی نمی‌شوند. وقتی موقعیت قابل مشاهده در viewport تنها target قابل اتکاست، از `click-coords` استفاده کنید.
- مسیرهای دانلود، trace، و upload به temp rootهای OpenClaw محدود هستند: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` همچنین می‌تواند file inputها را مستقیما از طریق `--input-ref` یا `--element` تنظیم کند.

شناسه‌ها و labelهای پایدار تب از جایگزینی raw-target در Chromium جان سالم به در می‌برند، وقتی OpenClaw بتواند تب جایگزین را اثبات کند، مانند URL یکسان یا تبدیل شدن یک تب قدیمی به یک تب جدید واحد پس از ارسال فرم. Raw target idها همچنان ناپایدار هستند؛ در اسکریپت‌ها `suggestedTargetId` از `tabs` را ترجیح دهید.

نگاهی سریع به flagهای snapshot:

- `--format ai` (پیش‌فرض با Playwright): snapshot هوش مصنوعی با refهای عددی (`aria-ref="<n>"`).
- `--format aria`: درخت دسترسی‌پذیری با refهای `axN`. وقتی Playwright در دسترس باشد، OpenClaw refها را با backend DOM idها به صفحه live وصل می‌کند تا actionهای بعدی بتوانند از آن‌ها استفاده کنند؛ در غیر این صورت خروجی را فقط برای بازرسی در نظر بگیرید.
- `--efficient` (یا `--mode efficient`): preset فشرده role snapshot. برای اینکه این حالت پیش‌فرض شود، `browser.snapshotDefaults.mode: "efficient"` را تنظیم کنید ([پیکربندی Gateway](/fa/gateway/configuration-reference#browser) را ببینید).
- `--interactive`, `--compact`, `--depth`, `--selector` یک role snapshot با refهای `ref=e12` را اجباری می‌کنند. `--frame "<iframe>"` role snapshotها را به یک iframe محدود می‌کند.
- `--labels` یک اسکرین‌شات فقط از viewport با labelهای ref روی آن اضافه می‌کند (`MEDIA:<path>` را چاپ می‌کند).
- `--urls` مقصدهای link کشف‌شده را به snapshotهای AI اضافه می‌کند.

## Snapshotها و refها

OpenClaw از دو سبک «snapshot» پشتیبانی می‌کند:

- **AI snapshot (refهای عددی)**: `openclaw browser snapshot` (پیش‌فرض؛ `--format ai`)
  - خروجی: یک snapshot متنی که شامل refهای عددی است.
  - Actionها: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - درون‌سیستمی، ref از طریق `aria-ref` در Playwright resolve می‌شود.

- **Role snapshot (role refهایی مانند `e12`)**: `openclaw browser snapshot --interactive` (یا `--compact`, `--depth`, `--selector`, `--frame`)
  - خروجی: یک list/tree مبتنی بر role با `[ref=e12]` (و `[nth=1]` اختیاری).
  - Actionها: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - درون‌سیستمی، ref از طریق `getByRole(...)` (به‌همراه `nth()` برای موارد تکراری) resolve می‌شود.
  - برای شامل کردن یک اسکرین‌شات viewport با labelهای `e12` روی آن، `--labels` را اضافه کنید.
  - وقتی متن link مبهم است و عامل به targetهای ناوبری مشخص نیاز دارد، `--urls` را اضافه کنید.

- **ARIA snapshot (ARIA refهایی مانند `ax12`)**: `openclaw browser snapshot --format aria`
  - خروجی: درخت دسترسی‌پذیری به‌صورت nodeهای ساختاریافته.
  - Actionها: وقتی مسیر snapshot بتواند ref را از طریق Playwright و Chrome backend DOM idها bind کند، `openclaw browser click ax12` کار می‌کند.
- اگر Playwright در دسترس نباشد، snapshotهای ARIA همچنان می‌توانند برای بازرسی مفید باشند، اما refها ممکن است قابل اقدام نباشند. وقتی به action refها نیاز دارید، دوباره با `--format ai` یا `--interactive` snapshot بگیرید.
- اثبات Docker برای مسیر fallback خام CDP: `pnpm test:docker:browser-cdp-snapshot`
  Chromium را با CDP شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند که role snapshotها شامل URLهای link، clickableهای ارتقایافته با cursor، و metadata مربوط به iframe باشند.

رفتار ref:

- ارجاع‌ها در پیمایش‌ها **پایدار نیستند**؛ اگر چیزی شکست خورد، `snapshot` را دوباره اجرا کنید و از یک ارجاع تازه استفاده کنید.
- `/act` پس از جایگزینیِ ناشی از عمل، وقتی بتواند تب جایگزین را اثبات کند، `targetId` خام فعلی را برمی‌گرداند.
  برای فرمان‌های بعدی همچنان از شناسه‌ها/برچسب‌های پایدار تب استفاده کنید.
- اگر snapshot نقش با `--frame` گرفته شده باشد، ارجاع‌های نقش تا snapshot نقش بعدی به همان iframe محدود می‌مانند.
- ارجاع‌های ناشناخته یا کهنه‌ی `axN` سریعاً شکست می‌خورند، به‌جای اینکه به selectorِ `aria-ref` در Playwright فروبیفتند.
  وقتی این اتفاق افتاد، روی همان تب یک snapshot تازه اجرا کنید.

## قابلیت‌های پیشرفته‌ی انتظار

می‌توانید فقط برای زمان/متن منتظر نمانید:

- انتظار برای URL (globهای پشتیبانی‌شده توسط Playwright):
  - `openclaw browser wait --url "**/dash"`
- انتظار برای وضعیت بارگذاری:
  - `openclaw browser wait --load networkidle`
- انتظار برای یک گزاره‌ی JS:
  - `openclaw browser wait --fn "window.ready===true"`
- انتظار برای نمایان شدن یک selector:
  - `openclaw browser wait "#main"`

این‌ها می‌توانند با هم ترکیب شوند:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## گردش‌کارهای اشکال‌زدایی

وقتی عملی شکست می‌خورد (مثلاً «قابل مشاهده نیست»، «نقض حالت سخت‌گیرانه»، «پوشیده شده»):

1. `openclaw browser snapshot --interactive`
2. از `click <ref>` / `type <ref>` استفاده کنید (در حالت تعاملی، ارجاع‌های نقش را ترجیح دهید)
3. اگر هنوز شکست می‌خورد: برای دیدن اینکه Playwright چه چیزی را هدف گرفته است، `openclaw browser highlight <ref>` را اجرا کنید
4. اگر صفحه رفتار عجیبی دارد:
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

snapshotهای نقش در JSON شامل `refs` به‌همراه یک بلوک کوچک `stats` هستند (lines/chars/refs/interactive) تا ابزارها بتوانند درباره‌ی اندازه و تراکم payload استدلال کنند.

## تنظیمات وضعیت و محیط

این‌ها برای گردش‌کارهای «سایت مثل X رفتار کند» مفید هستند:

- کوکی‌ها: `cookies`, `cookies set`, `cookies clear`
- ذخیره‌سازی: `storage local|session get|set|clear`
- آفلاین: `set offline on|off`
- سرآیندها: `set headers --headers-json '{"X-Debug":"1"}'` (`set headers --json '{"X-Debug":"1"}'` قدیمی همچنان پشتیبانی می‌شود)
- احراز هویت پایه‌ی HTTP: `set credentials user pass` (یا `--clear`)
- موقعیت جغرافیایی: `set geo <lat> <lon> --origin "https://example.com"` (یا `--clear`)
- رسانه: `set media dark|light|no-preference|none`
- منطقه‌ی زمانی / locale: `set timezone ...`, `set locale ...`
- دستگاه / viewport:
  - `set device "iPhone 14"` (presetهای دستگاه در Playwright)
  - `set viewport 1280 720`

## امنیت و حریم خصوصی

- پروفایل مرورگر openclaw ممکن است شامل نشست‌های واردشده باشد؛ با آن مانند داده‌ی حساس رفتار کنید.
- `browser act kind=evaluate` / `openclaw browser evaluate` و `wait --fn`
  JavaScript دلخواه را در context صفحه اجرا می‌کنند. prompt injection می‌تواند
  این را هدایت کند. اگر به آن نیاز ندارید، با `browser.evaluateEnabled=false` غیرفعالش کنید.
- برای ورودها و یادداشت‌های ضدبات (X/Twitter و غیره)، [ورود مرورگر + ارسال در X/Twitter](/fa/tools/browser-login) را ببینید.
- میزبان Gateway/node را خصوصی نگه دارید (local loopback یا فقط tailnet).
- endpointهای CDP راه‌دور قدرتمند هستند؛ آن‌ها را tunnel کنید و محافظت کنید.

نمونه‌ی حالت سخت‌گیرانه (مسیرهای خصوصی/داخلی را به‌صورت پیش‌فرض مسدود کنید):

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

- [مرورگر](/fa/tools/browser) — نمای کلی، پیکربندی، پروفایل‌ها، امنیت
- [ورود مرورگر](/fa/tools/browser-login) — ورود به سایت‌ها
- [عیب‌یابی Browser در Linux](/fa/tools/browser-linux-troubleshooting)
- [عیب‌یابی Browser WSL2](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
