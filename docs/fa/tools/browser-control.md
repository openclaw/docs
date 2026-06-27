---
read_when:
    - اسکریپت‌نویسی یا اشکال‌زدایی مرورگر عامل از طریق API کنترل محلی
    - به‌دنبال مرجع CLI `openclaw browser` هستید
    - افزودن خودکارسازی سفارشی مرورگر با اسنپ‌شات‌ها و ارجاع‌ها
summary: مرجع API کنترل مرورگر، CLI و کنش‌های اسکریپت‌نویسی OpenClaw
title: API کنترل مرورگر
x-i18n:
    generated_at: "2026-06-27T18:55:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ccfd1ec996b0fc211e2aefa0554e0fa5c7b0899ca981836134a3741b38bf7600
    source_path: tools/browser-control.md
    workflow: 16
---

برای راه‌اندازی، پیکربندی و عیب‌یابی، [مرورگر](/fa/tools/browser) را ببینید.
این صفحه مرجع API محلی کنترل HTTP، CLI مربوط به `openclaw browser`
و الگوهای اسکریپت‌نویسی است (snapshots، refs، waits، جریان‌های اشکال‌زدایی).

## API کنترل (اختیاری)

فقط برای یکپارچه‌سازی‌های محلی، Gateway یک API کوچک HTTP روی local loopback ارائه می‌کند.
این سرور مستقل اختیاری است — متغیر محیطی
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` را در محیط سرویس gateway تنظیم کنید
و پیش از در دسترس شدن endpointهای HTTP، gateway را بازراه‌اندازی کنید. بدون
این متغیر، runtime کنترل مرورگر همچنان از طریق CLI و
ابزارهای agent کار می‌کند، اما چیزی روی پورت کنترل loopback گوش نمی‌دهد.

- وضعیت/شروع/توقف: `GET /`, `POST /start`, `POST /stop`
- زبانه‌ها: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/اسکرین‌شات: `GET /snapshot`, `POST /screenshot`
- کنش‌ها: `POST /navigate`, `POST /act`
- Hookها: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- دانلودها: `POST /download`, `POST /wait/download`
- مجوزها: `POST /permissions/grant`
- اشکال‌زدایی: `GET /console`, `POST /pdf`
- اشکال‌زدایی: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- شبکه: `POST /response/body`
- وضعیت: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- وضعیت: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- تنظیمات: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

همه endpointها `?profile=<name>` را می‌پذیرند. `POST /start?headless=true` یک
اجرای headless یک‌باره را برای پروفایل‌های محلی مدیریت‌شده درخواست می‌کند، بدون اینکه
پیکربندی پایدار مرورگر را تغییر دهد؛ پروفایل‌های attach-only، CDP راه‌دور، و existing-session
این override را رد می‌کنند، چون OpenClaw آن فرایندهای مرورگر را اجرا نمی‌کند.

برای endpointهای زبانه، `targetId` نام فیلد سازگاری است. ترجیحاً
`suggestedTargetId` را از `GET /tabs` یا `POST /tabs/open` ارسال کنید؛ برچسب‌ها و handleهای `tabId`
مانند `t1` نیز پذیرفته می‌شوند. شناسه‌های خام target در CDP و پیشوندهای یکتای خام
target-id همچنان کار می‌کنند، اما handleهای تشخیصی ناپایدار هستند.

اگر احراز هویت gateway با راز مشترک پیکربندی شده باشد، مسیرهای HTTP مرورگر نیز به احراز هویت نیاز دارند:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` یا احراز هویت HTTP Basic با همان گذرواژه

نکته‌ها:

- این API مستقل loopback مرورگر، headerهای هویت trusted-proxy یا
  Tailscale Serve را مصرف **نمی‌کند**.
- اگر `gateway.auth.mode` برابر `none` یا `trusted-proxy` باشد، این مسیرهای loopback مرورگر
  آن حالت‌های حامل هویت را به ارث نمی‌برند؛ آن‌ها را فقط روی loopback نگه دارید.

### قرارداد خطای `/act`

`POST /act` برای اعتبارسنجی در سطح مسیر و
شکست‌های policy از پاسخ خطای ساختاریافته استفاده می‌کند:

```json
{ "error": "<message>", "code": "ACT_*" }
```

مقادیر فعلی `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` وجود ندارد یا شناخته‌شده نیست.
- `ACT_INVALID_REQUEST` (HTTP 400): payload کنش در نرمال‌سازی یا اعتبارسنجی شکست خورد.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` با نوع کنشی استفاده شد که پشتیبانی نمی‌شود.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (یا `wait --fn`) توسط config غیرفعال شده است.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` سطح بالا یا گروهی با target درخواست تعارض دارد.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): کنش برای پروفایل‌های existing-session پشتیبانی نمی‌شود.

شکست‌های دیگر runtime ممکن است همچنان `{ "error": "<message>" }` را بدون
فیلد `code` برگردانند.

### نیازمندی Playwright

برخی قابلیت‌ها (navigate/act/AI snapshot/role snapshot، اسکرین‌شات‌های element،
PDF) به Playwright نیاز دارند. اگر Playwright نصب نباشد، آن endpointها
یک خطای روشن 501 برمی‌گردانند.

چیزهایی که بدون Playwright همچنان کار می‌کنند:

- snapshotهای ARIA
- snapshotهای دسترس‌پذیری سبک role (`--interactive`, `--compact`,
  `--depth`, `--efficient`) وقتی WebSocket مربوط به CDP در سطح هر زبانه در دسترس باشد. این
  یک fallback برای بازرسی و کشف ref است؛ Playwright همچنان موتور اصلی
  کنش باقی می‌ماند.
- اسکرین‌شات‌های صفحه برای مرورگر مدیریت‌شده `openclaw` وقتی WebSocket مربوط به CDP
  در سطح هر زبانه در دسترس باشد
- اسکرین‌شات‌های صفحه برای پروفایل‌های `existing-session` / Chrome MCP
- اسکرین‌شات‌های مبتنی بر ref در `existing-session` (`--ref`) از خروجی snapshot

چیزهایی که همچنان به Playwright نیاز دارند:

- `navigate`
- `act`
- snapshotهای AI که به قالب AI snapshot بومی Playwright وابسته‌اند
- اسکرین‌شات‌های element با CSS-selector (`--element`)
- خروجی PDF کامل مرورگر

اسکرین‌شات‌های element همچنین `--full-page` را رد می‌کنند؛ route مقدار `fullPage is
not supported for element screenshots` را برمی‌گرداند.

اگر `Playwright is not available in this gateway build` را می‌بینید، Gateway بسته‌بندی‌شده
وابستگی اصلی runtime مرورگر را ندارد. OpenClaw را دوباره نصب یا به‌روزرسانی کنید،
سپس gateway را بازراه‌اندازی کنید. برای Docker، باینری‌های مرورگر Chromium را نیز
طبق آنچه پایین آمده نصب کنید.

#### نصب Docker Playwright

اگر Gateway شما در Docker اجرا می‌شود، از `npx playwright` پرهیز کنید (تعارض‌های npm override).
برای imageهای سفارشی، Chromium را داخل image قرار دهید:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

برای یک image موجود، به‌جای آن از طریق CLI همراه نصب کنید:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

برای پایدار نگه داشتن دانلودهای مرورگر، `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید (برای مثال،
`/home/node/.cache/ms-playwright`) و مطمئن شوید `/home/node` از طریق
`OPENCLAW_HOME_VOLUME` یا یک bind mount پایدار می‌ماند. OpenClaw در Linux به‌صورت خودکار
Chromium پایدارشده را شناسایی می‌کند. [Docker](/fa/install/docker) را ببینید.

## نحوه کارکرد (داخلی)

یک سرور کوچک کنترل loopback درخواست‌های HTTP را می‌پذیرد و از طریق CDP به مرورگرهای مبتنی بر Chromium وصل می‌شود. کنش‌های پیشرفته (click/type/snapshot/PDF) روی CDP و از طریق Playwright انجام می‌شوند؛ وقتی Playwright موجود نباشد، فقط عملیات غیر Playwright در دسترس است. agent یک رابط پایدار می‌بیند، در حالی که مرورگرها و پروفایل‌های محلی/راه‌دور آزادانه در لایه زیرین جابه‌جا می‌شوند.

## مرجع سریع CLI

همه دستورها `--browser-profile <name>` را برای هدف گرفتن یک پروفایل مشخص، و `--json` را برای خروجی قابل خواندن توسط ماشین می‌پذیرند.

<AccordionGroup>

<Accordion title="مبانی: وضعیت، زبانه‌ها، باز کردن/تمرکز/بستن">

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

<Accordion title="بازرسی: اسکرین‌شات، snapshot، console، خطاها، درخواست‌ها">

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

<Accordion title="کنش‌ها: navigate، click، type، drag، wait، evaluate">

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
openclaw browser upload media://inbound/file.pdf
openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'
openclaw browser dialog --accept
openclaw browser dialog --dismiss --dialog-id d1
openclaw browser wait --text "Done"
openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"
openclaw browser evaluate --fn '(el) => el.textContent' --ref 7
openclaw browser evaluate --fn 'const title = document.title; return title;'
openclaw browser evaluate --timeout-ms 30000 --fn 'async () => { await window.ready; return true; }'
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

- `upload` و `dialog` فراخوانی‌های **آماده‌سازی** هستند؛ آن‌ها را پیش از click/press که chooser/dialog را فعال می‌کند اجرا کنید. اگر یک کنش modal باز کند، پاسخ کنش شامل `blockedByDialog` و `browserState.dialogs.pending` است؛ همان `dialogId` را برای پاسخ مستقیم ارسال کنید. Dialogهایی که خارج از OpenClaw مدیریت شده‌اند زیر `browserState.dialogs.recent` ظاهر می‌شوند.
- `click`/`type`/و غیره به یک `ref` از `snapshot` نیاز دارند (عدد `12`، ref نقش `e12`، یا ref قابل اقدام ARIA یعنی `ax12`). CSS selectorها عمداً برای کنش‌ها پشتیبانی نمی‌شوند. وقتی موقعیت قابل مشاهده در viewport تنها target قابل اتکا است، از `click-coords` استفاده کنید.
- مسیرهای دانلود و trace به ریشه‌های موقت OpenClaw محدود هستند: `/tmp/openclaw{,/downloads}` (fallback: `${os.tmpdir()}/openclaw/...`).
- `upload` فایل‌های موجود در ریشه موقت uploads متعلق به OpenClaw و
  رسانه ورودی مدیریت‌شده توسط OpenClaw را می‌پذیرد. رسانه ورودی مدیریت‌شده را می‌توان به‌صورت
  `media://inbound/<id>`، مسیر sandbox-relative یعنی `media/inbound/<id>`، یا یک مسیر resolve‌شده
  داخل دایرکتوری رسانه ورودی مدیریت‌شده ارجاع داد. refهای رسانه تودرتو،
  traversal، symlinkها، hardlinkها، و مسیرهای محلی دلخواه همچنان رد می‌شوند.
- `upload` همچنین می‌تواند inputهای فایل را مستقیماً از طریق `--input-ref` یا `--element` تنظیم کند.

شناسه‌ها و برچسب‌های پایدار زبانه پس از جایگزینی raw-target در Chromium باقی می‌مانند، وقتی OpenClaw
بتواند زبانه جایگزین را اثبات کند، مانند همان URL یا تبدیل شدن یک زبانه قدیمی به
یک زبانه جدید پس از ارسال فرم. شناسه‌های raw target همچنان ناپایدار هستند؛ در اسکریپت‌ها
`suggestedTargetId` را از `tabs` ترجیح دهید.

مرور سریع flagهای snapshot:

- `--format ai` (پیش‌فرض با Playwright): اسنپ‌شات AI با ارجاع‌های عددی (`aria-ref="<n>"`).
- `--format aria`: درخت دسترس‌پذیری با ارجاع‌های `axN`. وقتی Playwright در دسترس باشد، OpenClaw ارجاع‌ها را با شناسه‌های backend DOM به صفحه زنده متصل می‌کند تا اقدام‌های بعدی بتوانند از آن‌ها استفاده کنند؛ در غیر این صورت خروجی را فقط برای بازرسی در نظر بگیرید.
- `--efficient` (یا `--mode efficient`): پیش‌تنظیم اسنپ‌شات نقش فشرده. `browser.snapshotDefaults.mode: "efficient"` را تنظیم کنید تا این حالت پیش‌فرض شود (ببینید [پیکربندی Gateway](/fa/gateway/configuration-reference#browser)).
- `--interactive`، `--compact`، `--depth`، `--selector` یک اسنپ‌شات نقش با ارجاع‌های `ref=e12` را اجباری می‌کنند. `--frame "<iframe>"` اسنپ‌شات‌های نقش را به یک iframe محدود می‌کند.
- با Playwright، `--labels` یک اسکرین‌شات با برچسب‌های ارجاع روی‌هم‌افتاده
  اضافه می‌کند (`MEDIA:<path>` را چاپ می‌کند) به‌همراه یک آرایه `annotations`
  که جعبه محدودکننده هر ارجاع را دارد. در `screenshot`، برچسب‌های مبتنی بر
  Playwright با `--full-page`، `--ref` و `--element` کار می‌کنند؛ در `snapshot`،
  اسکرین‌شات همراه همچنان فقط به viewport محدود می‌ماند. پروفایل‌های
  existing-session/chrome-mcp برچسب‌های روی‌هم‌افتاده را روی اسکرین‌شات‌های
  صفحه رندر می‌کنند اما `annotations` را برنمی‌گردانند و از کمک‌کننده
  projection تمام‌صفحه/ref/element در Playwright استفاده نمی‌کنند. بدون
  Playwright یا chrome-mcp، اسکرین‌شات‌های برچسب‌دار در دسترس نیستند.
- `--urls` مقصدهای پیوند کشف‌شده را به اسنپ‌شات‌های AI اضافه می‌کند.

## اسنپ‌شات‌ها و ارجاع‌ها

OpenClaw از دو سبک «اسنپ‌شات» پشتیبانی می‌کند:

- **اسنپ‌شات AI (ارجاع‌های عددی)**: `openclaw browser snapshot` (پیش‌فرض؛ `--format ai`)
  - خروجی: یک اسنپ‌شات متنی که شامل ارجاع‌های عددی است.
  - اقدام‌ها: `openclaw browser click 12`، `openclaw browser type 23 "hello"`.
  - در داخل، ارجاع از طریق `aria-ref` در Playwright حل می‌شود.

- **اسنپ‌شات نقش (ارجاع‌های نقش مانند `e12`)**: `openclaw browser snapshot --interactive` (یا `--compact`، `--depth`، `--selector`، `--frame`)
  - خروجی: یک فهرست/درخت مبتنی بر نقش با `[ref=e12]` (و در صورت نیاز `[nth=1]`).
  - اقدام‌ها: `openclaw browser click e12`، `openclaw browser highlight e12`.
  - در داخل، ارجاع از طریق `getByRole(...)` حل می‌شود (به‌همراه `nth()` برای موارد تکراری).
  - `--labels` را اضافه کنید تا یک اسکرین‌شات با برچسب‌های `e12` روی‌هم‌افتاده
    داشته باشید. در پروفایل‌های مبتنی بر Playwright، این همچنین فراداده
    جعبه محدودکننده برای هر ارجاع را برمی‌گرداند (`annotations[]`).
  - وقتی متن پیوند مبهم است و عامل به مقصدهای ناوبری مشخص نیاز دارد،
    `--urls` را اضافه کنید.

- **اسنپ‌شات ARIA (ارجاع‌های ARIA مانند `ax12`)**: `openclaw browser snapshot --format aria`
  - خروجی: درخت دسترس‌پذیری به‌صورت گره‌های ساختاریافته.
  - اقدام‌ها: وقتی مسیر اسنپ‌شات بتواند ارجاع را از طریق Playwright و شناسه‌های
    backend DOM در Chrome متصل کند، `openclaw browser click ax12` کار می‌کند.
- اگر Playwright در دسترس نباشد، اسنپ‌شات‌های ARIA همچنان می‌توانند برای
  بازرسی مفید باشند، اما ممکن است ارجاع‌ها قابل اقدام نباشند. وقتی به
  ارجاع‌های اقدام نیاز دارید، دوباره با `--format ai` یا `--interactive`
  اسنپ‌شات بگیرید.
- اثبات Docker برای مسیر fallback خام CDP: `pnpm test:docker:browser-cdp-snapshot`
  Chromium را با CDP راه‌اندازی می‌کند، `browser doctor --deep` را اجرا
  می‌کند و بررسی می‌کند که اسنپ‌شات‌های نقش شامل URLهای پیوند، عناصر قابل
  کلیک ارتقاداده‌شده با cursor، و فراداده iframe باشند.

رفتار ارجاع:

- ارجاع‌ها **در میان ناوبری‌ها پایدار نیستند**؛ اگر چیزی شکست خورد، `snapshot` را دوباره اجرا کنید و از یک ارجاع تازه استفاده کنید.
- `/act` پس از جایگزینی ناشی از اقدام، وقتی بتواند تب جایگزین را اثبات کند،
  `targetId` خام فعلی را برمی‌گرداند. برای فرمان‌های بعدی همچنان از شناسه‌ها/برچسب‌های
  پایدار تب استفاده کنید.
- اگر اسنپ‌شات نقش با `--frame` گرفته شده باشد، ارجاع‌های نقش تا اسنپ‌شات نقش بعدی به همان iframe محدود می‌شوند.
- ارجاع‌های ناشناخته یا کهنه `axN` به‌جای افتادن به selector
  `aria-ref` در Playwright، سریع شکست می‌خورند. وقتی این اتفاق افتاد، روی همان
  تب یک اسنپ‌شات تازه بگیرید.

## قابلیت‌های افزوده wait

می‌توانید فقط منتظر زمان/متن نمانید:

- انتظار برای URL (globها توسط Playwright پشتیبانی می‌شوند):
  - `openclaw browser wait --url "**/dash"`
- انتظار برای وضعیت بارگذاری:
  - `openclaw browser wait --load networkidle`
  - روی پروفایل‌های مدیریت‌شده `openclaw` و خام/remote CDP پشتیبانی می‌شود. پروفایل‌های `user` و `existing-session` مقدار `networkidle` را رد می‌کنند؛ در آن‌ها از انتظارهای `--url`، `--text`، یک selector، یا `--fn` استفاده کنید.
- انتظار برای یک گزاره JS:
  - `openclaw browser wait --fn "window.ready===true"`
- انتظار برای اینکه یک selector قابل مشاهده شود:
  - `openclaw browser wait "#main"`

این‌ها می‌توانند ترکیب شوند:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## گردش‌کارهای اشکال‌زدایی

وقتی یک اقدام شکست می‌خورد (مثلاً "not visible"، "strict mode violation"، "covered"):

1. `openclaw browser snapshot --interactive`
2. از `click <ref>` / `type <ref>` استفاده کنید (در حالت تعاملی، ارجاع‌های نقش را ترجیح دهید)
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

نمونه‌ها:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

اسنپ‌شات‌های نقش در JSON شامل `refs` به‌همراه یک بلوک کوچک `stats` هستند (lines/chars/refs/interactive) تا ابزارها بتوانند درباره اندازه و تراکم payload استدلال کنند.

## تنظیمات وضعیت و محیط

این‌ها برای گردش‌کارهای «کاری کن سایت مثل X رفتار کند» مفید هستند:

- کوکی‌ها: `cookies`، `cookies set`، `cookies clear`
- ذخیره‌سازی: `storage local|session get|set|clear`
- آفلاین: `set offline on|off`
- سرآیندها: `set headers --headers-json '{"X-Debug":"1"}'` (حالت قدیمی `set headers --json '{"X-Debug":"1"}'` همچنان پشتیبانی می‌شود)
- احراز هویت پایه HTTP: `set credentials user pass` (یا `--clear`)
- مکان جغرافیایی: `set geo <lat> <lon> --origin "https://example.com"` (یا `--clear`)
- رسانه: `set media dark|light|no-preference|none`
- منطقه زمانی / locale: `set timezone ...`، `set locale ...`
- دستگاه / viewport:
  - `set device "iPhone 14"` (پیش‌تنظیم‌های دستگاه Playwright)
  - `set viewport 1280 720`

## امنیت و حریم خصوصی

- پروفایل مرورگر openclaw ممکن است شامل نشست‌های واردشده باشد؛ آن را حساس در نظر بگیرید.
- `browser act kind=evaluate` / `openclaw browser evaluate` و `wait --fn`
  JavaScript دلخواه را در زمینه صفحه اجرا می‌کنند. تزریق prompt می‌تواند
  این را هدایت کند. اگر به آن نیاز ندارید، با `browser.evaluateEnabled=false`
  غیرفعالش کنید.
- `openclaw browser evaluate --fn` یک منبع تابع، یک عبارت، یا بدنه statement
  را می‌پذیرد. بدنه‌های statement به‌صورت توابع async بسته‌بندی می‌شوند، پس برای
  مقداری که می‌خواهید برگردد از `return` استفاده کنید. وقتی تابع سمت صفحه ممکن
  است بیش از زمان پیش‌فرض evaluate نیاز داشته باشد، از `--timeout-ms <ms>` استفاده کنید.
- برای ورودها و نکته‌های ضدبات (X/Twitter و غیره)، ببینید [ورود مرورگر + ارسال X/Twitter](/fa/tools/browser-login).
- میزبان Gateway/node را خصوصی نگه دارید (local loopback یا فقط tailnet).
- endpointهای remote CDP قدرتمند هستند؛ آن‌ها را tunnel و محافظت کنید.

نمونه strict-mode (مسدود کردن مقصدهای خصوصی/داخلی به‌صورت پیش‌فرض):

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
- [عیب‌یابی مرورگر WSL2 و Windows remote CDP](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
