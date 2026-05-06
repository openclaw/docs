---
read_when:
    - اسکریپت‌نویسی یا اشکال‌زدایی مرورگر عامل از طریق رابط برنامه‌نویسی کنترل محلی
    - در جست‌وجوی مرجع CLI مربوط به `openclaw browser`
    - افزودن خودکارسازی سفارشی مرورگر با نماگرفت‌ها و ارجاع‌ها
summary: API کنترل مرورگر OpenClaw، مرجع CLI و کنش‌های اسکریپت‌نویسی
title: API کنترل مرورگر
x-i18n:
    generated_at: "2026-05-06T09:45:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5367561122448fa21037c9125581eb38b7f01413310e9f9ca5880942acfffa5d
    source_path: tools/browser-control.md
    workflow: 16
---

برای راه‌اندازی، پیکربندی، و عیب‌یابی، [Browser](/fa/tools/browser) را ببینید.
این صفحه مرجع API HTTP کنترل محلی، CLI `openclaw browser`، و الگوهای اسکریپت‌نویسی است (snapshotها، refها، waitها، جریان‌های debug).

## API کنترل (اختیاری)

فقط برای یکپارچه‌سازی‌های محلی، Gateway یک API کوچک HTTP روی loopback ارائه می‌کند:

- وضعیت/شروع/توقف: `GET /`, `POST /start`, `POST /stop`
- تب‌ها: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/اسکرین‌شات: `GET /snapshot`, `POST /screenshot`
- اقدامات: `POST /navigate`, `POST /act`
- Hookها: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- دانلودها: `POST /download`, `POST /wait/download`
- مجوزها: `POST /permissions/grant`
- Debugging: `GET /console`, `POST /pdf`
- Debugging: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- شبکه: `POST /response/body`
- وضعیت: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- وضعیت: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- تنظیمات: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

همه endpointها `?profile=<name>` را می‌پذیرند. `POST /start?headless=true` یک اجرای
یک‌باره headless برای پروفایل‌های محلیِ مدیریت‌شده درخواست می‌کند، بدون اینکه
پیکربندی ماندگار مرورگر را تغییر دهد؛ پروفایل‌های attach-only، CDP ریموت، و
existing-session این override را رد می‌کنند، چون OpenClaw آن فرایندهای مرورگر را اجرا نمی‌کند.

اگر احراز هویت Gateway با shared-secret پیکربندی شده باشد، مسیرهای HTTP مرورگر نیز به احراز هویت نیاز دارند:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` یا HTTP Basic auth با همان گذرواژه

نکته‌ها:

- این API مستقل مرورگر روی loopback، هدرهای هویت trusted-proxy یا
  Tailscale Serve را مصرف نمی‌کند.
- اگر `gateway.auth.mode` برابر `none` یا `trusted-proxy` باشد، این مسیرهای مرورگر
  روی loopback آن حالت‌های حامل هویت را به ارث نمی‌برند؛ آن‌ها را فقط روی loopback نگه دارید.

### قرارداد خطای `/act`

`POST /act` برای اعتبارسنجی سطح مسیر و شکست‌های policy از پاسخ خطای ساختاریافته استفاده می‌کند:

```json
{ "error": "<message>", "code": "ACT_*" }
```

مقادیر فعلی `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` وجود ندارد یا شناخته‌شده نیست.
- `ACT_INVALID_REQUEST` (HTTP 400): payload اقدام در نرمال‌سازی یا اعتبارسنجی ناموفق بود.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` با نوع اقدام پشتیبانی‌نشده استفاده شد.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (یا `wait --fn`) توسط پیکربندی غیرفعال است.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` سطح بالا یا دسته‌ای با هدف درخواست تضاد دارد.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): اقدام برای پروفایل‌های existing-session پشتیبانی نمی‌شود.

شکست‌های runtime دیگر ممکن است همچنان `{ "error": "<message>" }` را بدون فیلد
`code` برگردانند.

### نیازمندی Playwright

برخی قابلیت‌ها (navigate/act/AI snapshot/role snapshot، اسکرین‌شات‌های عنصر،
PDF) به Playwright نیاز دارند. اگر Playwright نصب نباشد، آن endpointها
یک خطای واضح 501 برمی‌گردانند.

چیزهایی که بدون Playwright همچنان کار می‌کنند:

- snapshotهای ARIA
- snapshotهای دسترس‌پذیری به سبک role (`--interactive`, `--compact`,
  `--depth`, `--efficient`) وقتی یک CDP WebSocket برای هر تب در دسترس باشد. این
  یک fallback برای بازرسی و کشف ref است؛ Playwright همچنان موتور اصلی
  اقدام باقی می‌ماند.
- اسکرین‌شات‌های صفحه برای مرورگر مدیریت‌شده `openclaw` وقتی یک CDP
  WebSocket برای هر تب در دسترس باشد
- اسکرین‌شات‌های صفحه برای پروفایل‌های `existing-session` / Chrome MCP
- اسکرین‌شات‌های مبتنی بر ref در `existing-session` (`--ref`) از خروجی snapshot

چیزهایی که همچنان به Playwright نیاز دارند:

- `navigate`
- `act`
- AI snapshotهایی که به فرمت AI snapshot بومی Playwright وابسته‌اند
- اسکرین‌شات‌های عنصر با CSS-selector (`--element`)
- خروجی کامل PDF مرورگر

اسکرین‌شات‌های عنصر همچنین `--full-page` را رد می‌کنند؛ مسیر `fullPage is
not supported for element screenshots` را برمی‌گرداند.

اگر `Playwright is not available in this gateway build` را دیدید، Gateway بسته‌بندی‌شده
وابستگی runtime اصلی مرورگر را ندارد. OpenClaw را دوباره نصب یا به‌روزرسانی کنید،
سپس Gateway را restart کنید. برای Docker، باینری‌های مرورگر Chromium را نیز طبق نمونه زیر نصب کنید.

#### نصب Docker Playwright

اگر Gateway شما در Docker اجرا می‌شود، از `npx playwright` پرهیز کنید (تضادهای npm override).
به‌جای آن از CLI همراه بسته استفاده کنید:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

برای ماندگار کردن دانلودهای مرورگر، `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید (برای مثال،
`/home/node/.cache/ms-playwright`) و مطمئن شوید `/home/node` از طریق
`OPENCLAW_HOME_VOLUME` یا یک bind mount ماندگار شده است. [Docker](/fa/install/docker) را ببینید.

## نحوه کار (داخلی)

یک سرور کنترل کوچک روی loopback درخواست‌های HTTP را می‌پذیرد و از طریق CDP به مرورگرهای مبتنی بر Chromium وصل می‌شود. اقدامات پیشرفته (click/type/snapshot/PDF) از طریق Playwright روی CDP انجام می‌شوند؛ وقتی Playwright وجود نداشته باشد، فقط عملیات غیر Playwright در دسترس‌اند. agent یک رابط پایدار می‌بیند، درحالی‌که مرورگرها و پروفایل‌های محلی/ریموت آزادانه در زیر آن جابه‌جا می‌شوند.

## مرجع سریع CLI

همه فرمان‌ها `--browser-profile <name>` را برای هدف‌گیری یک پروفایل مشخص، و `--json` را برای خروجی قابل خواندن توسط ماشین می‌پذیرند.

<AccordionGroup>

<Accordion title="مبانی: وضعیت، تب‌ها، بازکردن/فوکوس/بستن">

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

<Accordion title="بازرسی: اسکرین‌شات، snapshot، کنسول، خطاها، درخواست‌ها">

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

<Accordion title="اقدامات: navigate، click، type، drag، wait، evaluate">

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

<Accordion title="وضعیت: cookieها، storage، offline، headerها، geo، device">

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

- `upload` و `dialog` فراخوانی‌های **arming** هستند؛ آن‌ها را پیش از click/press که chooser/dialog را فعال می‌کند اجرا کنید.
- `click`/`type`/و غیره به یک `ref` از `snapshot` نیاز دارند (`12` عددی، role ref `e12`، یا actionable ARIA ref `ax12`). CSS selectorها عمدا برای اقدامات پشتیبانی نمی‌شوند. وقتی موقعیت viewport قابل مشاهده تنها هدف قابل اتکا است، از `click-coords` استفاده کنید.
- مسیرهای download، trace، و upload به ریشه‌های temp OpenClaw محدودند: `/tmp/openclaw{,/downloads,/uploads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` همچنین می‌تواند inputهای فایل را مستقیما از طریق `--input-ref` یا `--element` تنظیم کند.

شناسه‌های پایدار تب و labelها وقتی OpenClaw بتواند تب جایگزین را اثبات کند، از
جایگزینی raw-target در Chromium جان سالم به در می‌برند؛ مانند URL یکسان یا تبدیل شدن
یک تب قدیمی به یک تب جدید پس از ارسال فرم. شناسه‌های raw target همچنان ناپایدارند؛ در اسکریپت‌ها
`suggestedTargetId` از `tabs` را ترجیح دهید.

نگاه سریع به flagهای snapshot:

- `--format ai` (پیش‌فرض با Playwright): AI snapshot با refهای عددی (`aria-ref="<n>"`).
- `--format aria`: درخت دسترس‌پذیری با refهای `axN`. وقتی Playwright در دسترس باشد، OpenClaw refها را با شناسه‌های backend DOM به صفحه زنده متصل می‌کند تا اقدامات بعدی بتوانند از آن‌ها استفاده کنند؛ در غیر این صورت خروجی را فقط برای بازرسی در نظر بگیرید.
- `--efficient` (یا `--mode efficient`): preset فشرده role snapshot. برای پیش‌فرض کردن آن، `browser.snapshotDefaults.mode: "efficient"` را تنظیم کنید ([پیکربندی Gateway](/fa/gateway/configuration-reference#browser) را ببینید).
- `--interactive`, `--compact`, `--depth`, `--selector` یک role snapshot با refهای `ref=e12` را اجبار می‌کنند. `--frame "<iframe>"` محدوده role snapshotها را به یک iframe محدود می‌کند.
- `--labels` یک اسکرین‌شات فقط از viewport با labelهای ref روی آن اضافه می‌کند (`MEDIA:<path>` را چاپ می‌کند).
- `--urls` مقصدهای لینک کشف‌شده را به AI snapshotها اضافه می‌کند.

## Snapshotها و refها

OpenClaw از دو سبک "snapshot" پشتیبانی می‌کند:

- **AI snapshot (refهای عددی)**: `openclaw browser snapshot` (پیش‌فرض؛ `--format ai`)
  - خروجی: یک snapshot متنی که شامل refهای عددی است.
  - اقدامات: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - در داخل، ref از طریق `aria-ref` مربوط به Playwright resolve می‌شود.

- **Role snapshot (role refهایی مانند `e12`)**: `openclaw browser snapshot --interactive` (یا `--compact`, `--depth`, `--selector`, `--frame`)
  - خروجی: یک فهرست/درخت مبتنی بر role با `[ref=e12]` (و `[nth=1]` اختیاری).
  - اقدامات: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - در داخل، ref از طریق `getByRole(...)` (به‌همراه `nth()` برای موارد تکراری) resolve می‌شود.
  - برای افزودن یک اسکرین‌شات viewport با labelهای `e12` روی آن، `--labels` را اضافه کنید.
  - وقتی متن لینک مبهم است و agent به هدف‌های concrete
    navigation نیاز دارد، `--urls` را اضافه کنید.

- **ARIA snapshot (ARIA refهایی مانند `ax12`)**: `openclaw browser snapshot --format aria`
  - خروجی: درخت دسترس‌پذیری به‌صورت nodeهای ساختاریافته.
  - اقدامات: `openclaw browser click ax12` وقتی کار می‌کند که مسیر snapshot بتواند
    ref را از طریق Playwright و شناسه‌های backend DOM در Chrome bind کند.
- اگر Playwright در دسترس نباشد، ARIA snapshotها همچنان می‌توانند برای
  بازرسی مفید باشند، اما refها ممکن است قابل اقدام نباشند. وقتی به refهای اقدام نیاز دارید،
  با `--format ai`
  یا `--interactive` دوباره snapshot بگیرید.
- اثبات Docker برای مسیر fallback raw-CDP: `pnpm test:docker:browser-cdp-snapshot`
  Chromium را با CDP شروع می‌کند، `browser doctor --deep` را اجرا می‌کند، و بررسی می‌کند که role
  snapshotها شامل URLهای لینک، clickables ارتقایافته با cursor، و متادیتای iframe باشند.

رفتار ref:

- refها **در میان پیمایش‌ها پایدار نیستند**؛ اگر چیزی شکست خورد، `snapshot` را دوباره اجرا کنید و از یک ref تازه استفاده کنید.
- `/act` پس از جایگزینیِ ناشی از action، وقتی بتواند تب جایگزین را اثبات کند،
  `targetId` خام فعلی را برمی‌گرداند. برای فرمان‌های بعدی همچنان از شناسه‌ها/برچسب‌های پایدار تب استفاده کنید.
- اگر snapshot نقش با `--frame` گرفته شده باشد، refهای نقش تا snapshot نقش بعدی به همان iframe محدود می‌شوند.
- refهای ناشناخته یا کهنه‌ی `axN` به‌جای افتادن در selector
  `aria-ref` در Playwright، سریع شکست می‌خورند. وقتی این اتفاق افتاد،
  روی همان تب یک snapshot تازه بگیرید.

## توان‌افزاهای انتظار

می‌توانید علاوه بر زمان/متن، برای موارد بیشتری منتظر بمانید:

- انتظار برای URL (globها توسط Playwright پشتیبانی می‌شوند):
  - `openclaw browser wait --url "**/dash"`
- انتظار برای وضعیت load:
  - `openclaw browser wait --load networkidle`
- انتظار برای predicate در JS:
  - `openclaw browser wait --fn "window.ready===true"`
- انتظار برای visible شدن یک selector:
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

وقتی یک action شکست می‌خورد (مثلاً "not visible"، "strict mode violation"، "covered"):

1. `openclaw browser snapshot --interactive`
2. از `click <ref>` / `type <ref>` استفاده کنید (در حالت interactive، refهای نقش را ترجیح دهید)
3. اگر همچنان شکست خورد: برای دیدن اینکه Playwright چه چیزی را هدف گرفته است، `openclaw browser highlight <ref>` را اجرا کنید
4. اگر صفحه رفتار عجیبی دارد:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. برای اشکال‌زدایی عمیق: یک trace ضبط کنید:
   - `openclaw browser trace start`
   - مشکل را بازتولید کنید
   - `openclaw browser trace stop` (‏`TRACE:<path>` را چاپ می‌کند)

## خروجی JSON

`--json` برای اسکریپت‌نویسی و ابزارهای ساختاریافته است.

نمونه‌ها:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

snapshotهای نقش در JSON شامل `refs` به‌همراه یک بلوک کوچک `stats` هستند (lines/chars/refs/interactive) تا ابزارها بتوانند درباره اندازه و تراکم payload استدلال کنند.

## کلیدهای وضعیت و محیط

این‌ها برای گردش‌کارهای «سایت را شبیه X رفتار بده» مفید هستند:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (شکل قدیمی `set headers --json '{"X-Debug":"1"}'` همچنان پشتیبانی می‌شود)
- احراز هویت پایه HTTP: `set credentials user pass` (یا `--clear`)
- Geolocation: `set geo <lat> <lon> --origin "https://example.com"` (یا `--clear`)
- Media: `set media dark|light|no-preference|none`
- Timezone / locale: `set timezone ...`, `set locale ...`
- Device / viewport:
  - `set device "iPhone 14"` (presetهای دستگاه Playwright)
  - `set viewport 1280 720`

## امنیت و حریم خصوصی

- پروفایل مرورگر openclaw ممکن است شامل sessionهای واردشده باشد؛ با آن مانند داده حساس رفتار کنید.
- `browser act kind=evaluate` / `openclaw browser evaluate` و `wait --fn`
  JavaScript دلخواه را در context صفحه اجرا می‌کنند. prompt injection می‌تواند
  این را هدایت کند. اگر به آن نیاز ندارید، با `browser.evaluateEnabled=false` غیرفعالش کنید.
- برای ورودها و نکات ضدبات (X/Twitter و غیره)، [ورود مرورگر + ارسال در X/Twitter](/fa/tools/browser-login) را ببینید.
- میزبان Gateway/Node را خصوصی نگه دارید (loopback یا فقط tailnet).
- endpointهای CDP راه‌دور قدرتمند هستند؛ آن‌ها را tunnel و محافظت کنید.

نمونه strict-mode (به‌طور پیش‌فرض مقصدهای خصوصی/داخلی را مسدود کنید):

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
