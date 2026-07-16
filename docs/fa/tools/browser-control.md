---
read_when:
    - اسکریپت‌نویسی یا اشکال‌زدایی مرورگر عامل از طریق API کنترل محلی
    - در جست‌وجوی مرجع CLI ‏`openclaw browser` هستید؟
    - افزودن خودکارسازی سفارشی مرورگر با اسنپ‌شات‌ها و ارجاع‌ها
summary: API کنترل مرورگر OpenClaw، مرجع CLI و کنش‌های اسکریپت‌نویسی
title: API کنترل مرورگر
x-i18n:
    generated_at: "2026-07-16T17:30:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8063f55c9881e45e65492dc40e2902bf05feb08ae9a74986ba2d7621e0dbe71a
    source_path: tools/browser-control.md
    workflow: 16
---

برای راه‌اندازی، پیکربندی و عیب‌یابی، به [مرورگر](/fa/tools/browser) مراجعه کنید.
این صفحه مرجع API کنترل HTTP محلی، `openclaw browser`
CLI و الگوهای اسکریپت‌نویسی (اسنپ‌شات‌ها، ارجاع‌ها، انتظارها و جریان‌های اشکال‌زدایی) است.

## API کنترل (اختیاری)

Gateway فقط برای یکپارچه‌سازی‌های محلی، یک API کوچک HTTP روی آدرس loopback ارائه می‌کند.
این سرور مستقل اختیاری است — متغیر محیطی
`OPENCLAW_EAGER_BROWSER_CONTROL_SERVER=1` را در محیط سرویس Gateway تنظیم کنید
و پیش از دردسترس قرار گرفتن نقطه‌های پایانی HTTP، Gateway را راه‌اندازی مجدد کنید. بدون
این متغیر، زمان‌اجرای کنترل مرورگر همچنان از طریق CLI و
ابزارهای عامل کار می‌کند، اما هیچ سرویسی روی درگاه کنترل loopback گوش نمی‌دهد.

- وضعیت/شروع/توقف: `GET /`، `GET /doctor`، `POST /start`، `POST /stop`، `POST /reset-profile`
- پروفایل‌ها: `GET /profiles`، `POST /profiles/create`، `DELETE /profiles/:name`
- زبانه‌ها: `GET /tabs`، `POST /tabs/open`، `POST /tabs/focus`، `DELETE /tabs/:targetId`، `POST /tabs/action`
- اسنپ‌شات/تصویر صفحه: `GET /snapshot`، `POST /screenshot`
- کنش‌ها: `POST /navigate`، `POST /act`
- قلاب‌ها: `POST /hooks/file-chooser`، `POST /hooks/dialog`
- بارگیری‌ها: `POST /download`، `POST /wait/download`
- مجوزها: `POST /permissions/grant`
- اشکال‌زدایی: `GET /console`، `POST /pdf`
- اشکال‌زدایی: `GET /errors`، `GET /requests`، `GET /dialogs`، `POST /trace/start`، `POST /trace/stop`، `POST /highlight`
- شبکه: `POST /response/body`
- وضعیت: `GET /cookies`، `POST /cookies/set`، `POST /cookies/clear`
- وضعیت: `GET /storage/:kind`، `POST /storage/:kind/set`، `POST /storage/:kind/clear`
- تنظیمات: `POST /set/offline`، `POST /set/headers`، `POST /set/credentials`، `POST /set/geolocation`، `POST /set/media`، `POST /set/timezone`، `POST /set/locale`، `POST /set/device`

`POST /tabs/action` شکل دسته‌ای است که CLI در داخل برای
زیر‌فرمان‌های `browser tab` استفاده می‌کند (`{"action":"new"|"label"|"select"|"close"|"list", ...}`)؛
هنگام اسکریپت‌نویسی مستقیم، مسیرهای تک‌منظوره زبانه در بالا را ترجیح دهید.

همه نقطه‌های پایانی `?profile=<name>` را می‌پذیرند. `POST /start?headless=true` یک
راه‌اندازی یک‌باره بدون رابط گرافیکی را برای پروفایل‌های مدیریت‌شده محلی، بدون تغییر پیکربندی ذخیره‌شده
مرورگر، درخواست می‌کند؛ پروفایل‌های فقط‌اتصال، CDP راه‌دور و نشست موجود
این بازنویسی را رد می‌کنند، زیرا OpenClaw آن فرایندهای مرورگر را راه‌اندازی نمی‌کند.

برای نقطه‌های پایانی زبانه، `targetId` نام فیلد سازگاری است. ارسال
`suggestedTargetId` از `GET /tabs` یا `POST /tabs/open` را ترجیح دهید؛ برچسب‌ها و شناسه‌های
`tabId` مانند `t1` نیز پذیرفته می‌شوند. شناسه‌های خام هدف CDP و پیشوندهای یکتای خام
شناسه هدف همچنان کار می‌کنند، اما شناسه‌های تشخیصی ناپایداری هستند.

اگر احراز هویت Gateway با راز مشترک پیکربندی شده باشد، مسیرهای HTTP مرورگر نیز به احراز هویت نیاز دارند:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` یا احراز هویت HTTP Basic با همان گذرواژه

نکات:

- این API مستقل مرورگر روی loopback، سرآیندهای هویت پراکسی مورد اعتماد یا
  Tailscale Serve را **مصرف نمی‌کند**.
- اگر `gateway.auth.mode` برابر `none` یا `trusted-proxy` باشد، این مسیرهای مرورگر روی loopback
  آن حالت‌های حامل هویت را به ارث نمی‌برند؛ آن‌ها را فقط روی loopback نگه دارید.

### قرارداد خطای `/act`

`POST /act` برای اعتبارسنجی در سطح مسیر و
خطاهای خط‌مشی از پاسخ خطای ساختاریافته استفاده می‌کند:

```json
{ "error": "<message>", "code": "ACT_*" }
```

مقادیر فعلی `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` وجود ندارد یا شناخته‌شده نیست.
- `ACT_INVALID_REQUEST` (HTTP 400): محموله کنش در نرمال‌سازی یا اعتبارسنجی ناموفق بود.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` با یک نوع کنش پشتیبانی‌نشده استفاده شد.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (یا `wait --fn`) توسط پیکربندی غیرفعال شده است.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` سطح‌بالا یا دسته‌ای با هدف درخواست تعارض دارد.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): کنش برای پروفایل‌های نشست موجود پشتیبانی نمی‌شود.

سایر خطاهای زمان‌اجرا ممکن است همچنان `{ "error": "<message>" }` را بدون
فیلد `code` برگردانند.

### نیازمندی Playwright

برخی قابلیت‌ها (پیمایش/کنش/اسنپ‌شات هوش مصنوعی/اسنپ‌شات نقش، تصاویر صفحه عناصر،
PDF) به Playwright نیاز دارند. اگر Playwright نصب نباشد، آن نقطه‌های پایانی
یک خطای واضح 501 برمی‌گردانند.

مواردی که بدون Playwright همچنان کار می‌کنند:

- اسنپ‌شات‌های ARIA
- اسنپ‌شات‌های دسترس‌پذیری به سبک نقش (`--interactive`، `--compact`،
  `--depth`، `--efficient`) هنگامی که WebSocket مربوط به CDP هر زبانه در دسترس باشد. این
  یک راهکار جایگزین برای بازرسی و یافتن ارجاع است؛ Playwright همچنان موتور اصلی
  کنش باقی می‌ماند.
- تصاویر کامل صفحه برای مرورگر مدیریت‌شده `openclaw` هنگامی که WebSocket مربوط به CDP
  هر زبانه در دسترس باشد
- تصاویر کامل صفحه برای پروفایل‌های `existing-session` / Chrome MCP
- تصاویر مبتنی بر ارجاع `existing-session` (`--ref`) از خروجی اسنپ‌شات

مواردی که همچنان به Playwright نیاز دارند:

- `navigate`
- `act`
- اسنپ‌شات‌های هوش مصنوعی که به قالب بومی اسنپ‌شات هوش مصنوعی Playwright وابسته‌اند
- تصاویر عناصر با انتخابگر CSS (`--element`)
- صدور PDF کامل مرورگر

تصاویر عناصر همچنین `--full-page` را رد می‌کنند؛ مسیر `fullPage is
not supported for element screenshots` را برمی‌گرداند.

اگر `Playwright is not available in this gateway build` را مشاهده کردید، بسته
Gateway وابستگی اصلی زمان‌اجرای مرورگر را ندارد. OpenClaw را دوباره نصب یا به‌روزرسانی کنید،
سپس Gateway را راه‌اندازی مجدد کنید. برای Docker، فایل‌های اجرایی مرورگر Chromium را نیز
مطابق زیر نصب کنید.

#### نصب Playwright در Docker

اگر Gateway در Docker اجرا می‌شود، از `npx playwright` اجتناب کنید (تداخل بازنویسی npm).
برای ایمیج‌های سفارشی، Chromium را درون ایمیج قرار دهید:

```bash
OPENCLAW_INSTALL_BROWSER=1 ./scripts/docker/setup.sh
```

برای یک ایمیج موجود، در عوض از طریق CLI همراه بسته نصب کنید:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

برای پایدار نگه‌داشتن بارگیری‌های مرورگر، `PLAYWRIGHT_BROWSERS_PATH` را تنظیم کنید (برای مثال،
`/home/node/.cache/ms-playwright`) و مطمئن شوید `/home/node` از طریق
`OPENCLAW_HOME_VOLUME` یا یک bind mount پایدار می‌ماند. OpenClaw در Linux،
Chromium پایدارشده را به‌طور خودکار شناسایی می‌کند. به [Docker](/fa/install/docker) مراجعه کنید.

## نحوه کار (داخلی)

یک سرور کنترل کوچک روی loopback درخواست‌های HTTP را می‌پذیرد و از طریق CDP به مرورگرهای مبتنی بر Chromium متصل می‌شود. کنش‌های پیشرفته (کلیک/تایپ/اسنپ‌شات/PDF) از طریق Playwright روی CDP انجام می‌شوند؛ وقتی Playwright موجود نباشد، فقط عملیات غیروابسته به Playwright در دسترس هستند. عامل یک رابط پایدار می‌بیند، درحالی‌که مرورگرها و پروفایل‌های محلی/راه‌دور در لایه زیرین آزادانه جابه‌جا می‌شوند.

## مرجع سریع CLI

همه فرمان‌ها `--browser-profile <name>` را برای هدف‌گیری یک پروفایل مشخص و `--json` را برای خروجی قابل‌خواندن توسط ماشین می‌پذیرند.

<AccordionGroup>

<Accordion title="مبانی: وضعیت، زبانه‌ها، باز کردن/تمرکز/بستن">

```bash
openclaw browser status
openclaw browser doctor
openclaw browser doctor --deep    # افزودن یک کاوش زنده اسنپ‌شات
openclaw browser start
openclaw browser start --headless # راه‌اندازی یک‌باره مدیریت‌شده محلی بدون رابط گرافیکی
openclaw browser stop            # همچنین شبیه‌سازی را در CDP فقط‌اتصال/راه‌دور پاک می‌کند
openclaw browser reset-profile   # داده‌های مرورگر پروفایل را به Trash منتقل می‌کند
openclaw browser tabs
openclaw browser tab             # میان‌بر زبانه فعلی
openclaw browser tab new
openclaw browser tab new --label research
openclaw browser tab label abcd1234 research
openclaw browser tab select 2
openclaw browser tab close 2
openclaw browser open https://example.com
openclaw browser focus abcd1234
openclaw browser close abcd1234
```

</Accordion>

<Accordion title="پروفایل‌ها: فهرست، ایجاد، حذف">

```bash
openclaw browser profiles
openclaw browser create-profile --name research --color "#0066CC"
openclaw browser create-profile --name attach --driver existing-session --cdp-url http://127.0.0.1:9222
openclaw browser delete-profile --name research
```

</Accordion>

<Accordion title="بازرسی: تصویر صفحه، اسنپ‌شات، کنسول، خطاها، درخواست‌ها">

```bash
openclaw browser screenshot
openclaw browser screenshot --full-page
openclaw browser screenshot --ref 12        # یا --ref e12
openclaw browser screenshot --labels
openclaw browser snapshot
openclaw browser snapshot --format aria --limit 200
openclaw browser snapshot --interactive --compact --depth 6
openclaw browser snapshot --efficient
openclaw browser snapshot --labels
openclaw browser snapshot --urls
openclaw browser snapshot --selector "#main" --interactive
openclaw browser snapshot --frame "iframe#main" --interactive
openclaw browser snapshot --out snapshot.txt
openclaw browser console --level error
openclaw browser errors --clear
openclaw browser requests --filter api --clear
openclaw browser pdf
openclaw browser responsebody "**/api" --max-chars 5000
```

</Accordion>

<Accordion title="کنش‌ها: پیمایش، کلیک، تایپ، کشیدن، انتظار، ارزیابی">

```bash
openclaw browser navigate https://example.com
openclaw browser resize 1280 720
openclaw browser click 12 --double           # یا e12 برای ارجاع‌های نقش
openclaw browser click-coords 120 340        # مختصات viewport
openclaw browser type 23 "hello" --submit
openclaw browser press Enter
openclaw browser hover 44
openclaw browser scrollintoview e12
openclaw browser drag 10 11
openclaw browser select 9 OptionA OptionB
openclaw browser download e12 report.pdf
openclaw browser waitfordownload report.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf
openclaw browser upload /tmp/openclaw/uploads/file.pdf --ref e12
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

<Accordion title="وضعیت: کوکی‌ها، ذخیره‌سازی، آفلاین، سرآیندها، موقعیت جغرافیایی، دستگاه">

```bash
openclaw browser cookies
openclaw browser cookies set session abc123 --url "https://example.com"
openclaw browser cookies clear
openclaw browser storage local get
openclaw browser storage local set theme dark
openclaw browser storage session clear
openclaw browser set offline on
openclaw browser set headers --headers-json '{"X-Debug":"1"}'
openclaw browser set credentials user pass            # برای حذف، --clear
openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"
openclaw browser set media dark
openclaw browser set timezone America/New_York
openclaw browser set locale en-US
openclaw browser set device "iPhone 14"
```

</Accordion>

</AccordionGroup>

نکات:

- ابزار `browser` که در اختیار عامل قرار می‌گیرد، `action=download` (با `ref` و
  `path` الزامی) و `action=waitfordownload` (با `path` اختیاری) را ارائه می‌کند. هر دو، نشانی URL بارگیری ذخیره‌شده،
  نام فایل پیشنهادی و مسیر محلی محافظت‌شده را برمی‌گردانند. رهگیری صریح بارگیری
  برای پروفایل‌های مدیریت‌شده Playwright در دسترس است؛ پروفایل‌های نشست موجود
  خطای پشتیبانی‌نشدن عملیات را برمی‌گردانند.
- بارگذاری‌های اتمی از طریق انتخاب‌گر را ترجیح دهید: محرک `--ref` را همراه بارگذاری ارسال کنید تا OpenClaw در یک درخواست آماده‌سازی و کلیک کند. حالت فقط‌مسیرِ `upload` برای مواردی که محرک بعدی عمدی است همچنان پشتیبانی می‌شود. برای تنظیم مستقیم ورودی فایل، از `--input-ref` یا `--element` استفاده کنید. `dialog` یک فراخوانی آماده‌سازی است؛ آن را پیش از کلیک/فشردنی اجرا کنید که پنجره محاوره‌ای را فعال می‌کند. اگر عملی یک پنجره مودال باز کند، پاسخ آن عمل شامل `blockedByDialog` و `browserState.dialogs.pending` است؛ برای پاسخ مستقیم، همان `dialogId` را ارسال کنید. پنجره‌های محاوره‌ای که خارج از OpenClaw مدیریت می‌شوند، زیر `browserState.dialogs.recent` نمایش داده می‌شوند.
- `click`/`type`/و موارد مشابه، به یک `ref` از `snapshot` نیاز دارند (`12` عددی، ارجاع نقش `e12` یا ارجاع ARIA قابل‌اقدام `ax12`). انتخاب‌گرهای CSS عمداً برای عملیات پشتیبانی نمی‌شوند. وقتی موقعیت قابل‌مشاهده در نمای دید تنها هدف قابل‌اعتماد است، از `click-coords` استفاده کنید.
- مسیرهای بارگیری و ردیابی به ریشه‌های موقت OpenClaw محدود هستند: `/tmp/openclaw{,/downloads}` (مسیر جایگزین: `${os.tmpdir()}/openclaw/...`).
- `upload` فایل‌ها را از ریشه بارگذاری‌های موقت OpenClaw و
  رسانه ورودی مدیریت‌شده OpenClaw می‌پذیرد. می‌توان به رسانه ورودی مدیریت‌شده به‌شکل
  `media://inbound/<id>`، `media/inbound/<id>` نسبی به محیط ایزوله یا یک
  مسیر حل‌شده درون پوشه رسانه ورودی مدیریت‌شده ارجاع داد. ارجاع‌های رسانه‌ای تودرتو،
  پیمایش مسیر، پیوندهای نمادین، پیوندهای سخت و مسیرهای محلی دلخواه همچنان رد می‌شوند.
- `upload` همچنین می‌تواند ورودی‌های فایل را مستقیماً از طریق `--input-ref` یا `--element` تنظیم کند.

شناسه‌ها و برچسب‌های پایدار زبانه هنگام جایگزینی هدف خام Chromium باقی می‌مانند، مشروط بر اینکه OpenClaw
بتواند زبانه جایگزین را اثبات کند؛ مانند یک جفت قدیمی/جدید یکتا برای یک URL یکسان، یا
تبدیل یک زبانه قدیمی به یک زبانه جدید پس از ارسال فرم. جایگزینی‌های مبهم با
URL تکراری، دسته‌های تازه دریافت می‌کنند. شناسه‌های هدف خام همچنان
ناپایدارند؛ در اسکریپت‌ها `suggestedTargetId` از `tabs` را ترجیح دهید.

مروری سریع بر پرچم‌های اسنپ‌شات:

- `--format ai` (پیش‌فرض با Playwright): اسنپ‌شات هوش مصنوعی با ارجاع‌های عددی (`aria-ref="<n>"`).
- `--format aria`: درخت دسترس‌پذیری با ارجاع‌های `axN`. وقتی Playwright در دسترس باشد، OpenClaw ارجاع‌های دارای شناسه‌های DOM پشتیبان را به صفحه زنده متصل می‌کند تا عملیات بعدی بتوانند از آن‌ها استفاده کنند؛ در غیر این صورت، خروجی را فقط برای بازرسی در نظر بگیرید.
- `--efficient` (یا `--mode efficient`): پیش‌تنظیم فشرده اسنپ‌شات نقش. برای پیش‌فرض‌کردن این حالت، `browser.snapshotDefaults.mode: "efficient"` را تنظیم کنید ([پیکربندی Gateway](/fa/gateway/configuration-reference#browser) را ببینید).
- `--interactive`، `--compact`، `--depth` و `--selector` یک اسنپ‌شات نقش با ارجاع‌های `ref=e12` را اجباری می‌کنند. `--frame "<iframe>"` اسنپ‌شات‌های نقش را به یک iframe محدود می‌کند.
- با Playwright، گزینه `--labels` یک نماگرفت با برچسب‌های ارجاع هم‌پوشان اضافه می‌کند
  (`MEDIA:<path>` را چاپ می‌کند)، به‌همراه یک آرایه `annotations` شامل کادر محدودکننده
  هر ارجاع. در `screenshot`، برچسب‌های مبتنی بر Playwright با `--full-page`،
  `--ref` و `--element` کار می‌کنند؛ در `snapshot`، نماگرفت همراه همچنان
  فقط محدود به نمای دید است. پروفایل‌های نشست موجود/chrome-mcp برچسب‌های هم‌پوشان را روی
  نماگرفت‌های صفحه رندر می‌کنند، اما `annotations` را برنمی‌گردانند و از
  کمک‌تابع Playwright برای تصویر تمام‌صفحه/ارجاع/عنصر استفاده نمی‌کنند. بدون Playwright یا chrome-mcp،
  نماگرفت‌های برچسب‌دار در دسترس نیستند.
- `--urls` مقصد پیوندهای کشف‌شده را به اسنپ‌شات‌های هوش مصنوعی می‌افزاید.

## اسنپ‌شات‌ها و ارجاع‌ها

OpenClaw از دو سبک «اسنپ‌شات» پشتیبانی می‌کند:

- **اسنپ‌شات هوش مصنوعی (ارجاع‌های عددی)**: `openclaw browser snapshot` (پیش‌فرض؛ `--format ai`)
  - خروجی: یک اسنپ‌شات متنی که شامل ارجاع‌های عددی است.
  - عملیات: `openclaw browser click 12`، `openclaw browser type 23 "hello"`.
  - در سطح داخلی، ارجاع از طریق `aria-ref` متعلق به Playwright حل می‌شود.

- **اسنپ‌شات نقش (ارجاع‌های نقش مانند `e12`)**: `openclaw browser snapshot --interactive` (یا `--compact`، `--depth`، `--selector`، `--frame`)
  - خروجی: یک فهرست/درخت مبتنی بر نقش با `[ref=e12]` (و `[nth=1]` اختیاری).
  - عملیات: `openclaw browser click e12`، `openclaw browser highlight e12`.
  - در سطح داخلی، ارجاع از طریق `getByRole(...)` (به‌همراه `nth()` برای موارد تکراری) حل می‌شود.
  - `--labels` را اضافه کنید تا یک نماگرفت با برچسب‌های هم‌پوشان `e12` نیز گنجانده شود. در
    پروفایل‌های مبتنی بر Playwright، این گزینه فراداده کادر محدودکننده هر ارجاع
    (`annotations[]`) را نیز برمی‌گرداند.
  - وقتی متن پیوند مبهم است و عامل به اهداف پیمایش مشخص نیاز دارد،
    `--urls` را اضافه کنید.

- **اسنپ‌شات ARIA (ارجاع‌های ARIA مانند `ax12`)**: `openclaw browser snapshot --format aria`
  - خروجی: درخت دسترس‌پذیری به‌شکل گره‌های ساخت‌یافته.
  - عملیات: `openclaw browser click ax12` زمانی کار می‌کند که مسیر اسنپ‌شات بتواند
    ارجاع را از طریق Playwright و شناسه‌های DOM پشتیبان Chrome متصل کند.
- اگر Playwright در دسترس نباشد، اسنپ‌شات‌های ARIA همچنان می‌توانند برای
  بازرسی مفید باشند، اما ممکن است ارجاع‌ها قابل‌اقدام نباشند. وقتی به ارجاع‌های عملیاتی نیاز دارید،
  دوباره با `--format ai` یا `--interactive` اسنپ‌شات بگیرید.
- اثبات Docker برای مسیر جایگزین CDP خام: `pnpm test:docker:browser-cdp-snapshot`
  Chromium را با CDP راه‌اندازی می‌کند، `browser doctor --deep` را اجرا می‌کند و تأیید می‌کند که اسنپ‌شات‌های نقش
  شامل URL پیوندها، عناصر قابل‌کلیک ارتقایافته با نشانگر و فراداده iframe هستند.

رفتار ارجاع‌ها:

- ارجاع‌ها در میان پیمایش‌ها **پایدار نیستند**؛ اگر چیزی ناموفق بود، `snapshot` را دوباره اجرا کنید و از یک ارجاع تازه استفاده کنید.
- `/act` پس از جایگزینی ناشی از یک عمل، در صورتی که بتواند زبانه جایگزین را اثبات کند،
  `targetId` خام فعلی را برمی‌گرداند. برای فرمان‌های بعدی همچنان از
  شناسه‌ها/برچسب‌های پایدار زبانه استفاده کنید.
- اگر اسنپ‌شات نقش با `--frame` گرفته شده باشد، ارجاع‌های نقش تا اسنپ‌شات نقش بعدی به همان iframe محدود می‌شوند.
- ارجاع‌های `axN` ناشناخته یا منقضی‌شده، به‌جای انتقال به انتخاب‌گر
  `aria-ref` متعلق به Playwright، بلافاصله ناموفق می‌شوند. وقتی چنین اتفاقی افتاد،
  در همان زبانه یک اسنپ‌شات تازه بگیرید.

## قابلیت‌های پیشرفته انتظار

می‌توانید برای مواردی فراتر از زمان/متن منتظر بمانید:

- انتظار برای URL (الگوهای glob توسط Playwright پشتیبانی می‌شوند):
  - `openclaw browser wait --url "**/dash"`
- انتظار برای وضعیت بارگذاری:
  - `openclaw browser wait --load networkidle`
  - در پروفایل‌های مدیریت‌شده `openclaw` و پروفایل‌های CDP خام/راه‌دور پشتیبانی می‌شود. پروفایل‌هایی که از راه‌انداز `existing-session` استفاده می‌کنند (از جمله پروفایل پیش‌فرض `user`) گزینه `networkidle` را رد می‌کنند؛ در آنجا از انتظارهای `--url`، `--text`، یک انتخاب‌گر یا `--fn` استفاده کنید.
- انتظار برای یک گزاره JS:
  - `openclaw browser wait --fn "window.ready===true"`
- انتظار برای نمایان‌شدن یک انتخاب‌گر:
  - `openclaw browser wait "#main"`

این موارد را می‌توان ترکیب کرد:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## گردش‌کارهای اشکال‌زدایی

وقتی عملی ناموفق است (برای مثال «نمایان نیست»، «نقض حالت سخت‌گیرانه»، «پوشانده شده است»):

1. `openclaw browser snapshot --interactive`
2. از `click <ref>` / `type <ref>` استفاده کنید (در حالت تعاملی، ارجاع‌های نقش را ترجیح دهید)
3. اگر همچنان ناموفق بود: برای دیدن هدف Playwright از `openclaw browser highlight <ref>` استفاده کنید
4. اگر صفحه رفتار عجیبی دارد:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. برای اشکال‌زدایی عمیق، یک ردگیری ضبط کنید:
   - `openclaw browser trace start`
   - مشکل را بازتولید کنید
   - `openclaw browser trace stop` (`TRACE:<path>` را چاپ می‌کند)

## خروجی JSON

`--json` برای اسکریپت‌نویسی و ابزارهای ساخت‌یافته است.

مثال‌ها:

```bash
openclaw browser --json status
openclaw browser --json snapshot --interactive
openclaw browser --json requests --filter api
openclaw browser --json cookies
```

اسنپ‌شات‌های نقش در JSON شامل `refs` به‌همراه یک بلوک کوچک `stats` (خط‌ها/نویسه‌ها/ارجاع‌ها/تعاملی) هستند تا ابزارها بتوانند اندازه و تراکم بار داده را ارزیابی کنند.

## تنظیمات وضعیت و محیط

این موارد برای گردش‌کارهای «سایت را وادار کن مانند X رفتار کند» مفید هستند:

- کوکی‌ها: `cookies`، `cookies set`، `cookies clear`
- فضای ذخیره‌سازی: `storage local|session get|set|clear`
- آفلاین: `set offline on|off`
- سرآیندها: `set headers --headers-json '{"X-Debug":"1"}'` (یا شکل موقعیتی `set headers '{"X-Debug":"1"}'`)
- احراز هویت پایه HTTP: `set credentials user pass` (یا `--clear`)
- موقعیت جغرافیایی: `set geo <lat> <lon> --origin "https://example.com"` (یا `--clear`)
- رسانه: `set media dark|light|no-preference|none`
- منطقه زمانی / محلی‌سازی: `set timezone ...`، `set locale ...`
- دستگاه / نمای دید:
  - `set device "iPhone 14"` (پیش‌تنظیم‌های دستگاه Playwright)
  - `set viewport 1280 720`

## امنیت و حریم خصوصی

- پروفایل مرورگر openclaw ممکن است شامل نشست‌های واردشده باشد؛ آن را حساس در نظر بگیرید.
- `browser act kind=evaluate` / `openclaw browser evaluate` و `wait --fn`
  جاوااسکریپت دلخواه را در زمینه صفحه اجرا می‌کنند. تزریق پرامپت می‌تواند
  این رفتار را هدایت کند. اگر به آن نیاز ندارید، با `browser.evaluateEnabled=false` غیرفعالش کنید.
- `openclaw browser evaluate --fn` منبع یک تابع، یک عبارت یا
  بدنه یک دستور را می‌پذیرد. بدنه‌های دستور در قالب توابع ناهمگام پیچیده می‌شوند، بنابراین برای
  مقداری که می‌خواهید برگردانده شود از `return` استفاده کنید. وقتی تابع سمت صفحه
  ممکن است به زمانی طولانی‌تر از مهلت پیش‌فرض ارزیابی نیاز داشته باشد، از `--timeout-ms <ms>` استفاده کنید.
- برای ورودها و نکات ضدربات (X/Twitter و موارد مشابه)، [ورود مرورگر + ارسال پست در X/Twitter](/fa/tools/browser-login) را ببینید.
- میزبان Gateway/node را خصوصی نگه دارید (فقط loopback یا tailnet).
- نقاط پایانی CDP راه‌دور قدرتمند هستند؛ آن‌ها را تونل‌گذاری و محافظت کنید.

نمونه حالت سخت‌گیرانه (مسدودسازی پیش‌فرض مقصدهای خصوصی/داخلی):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // اجازه دقیق اختیاری
    },
  },
}
```

## مرتبط

- [مرورگر](/fa/tools/browser) - نمای کلی، پیکربندی، پروفایل‌ها، امنیت
- [ورود مرورگر](/fa/tools/browser-login) - ورود به سایت‌ها
- [عیب‌یابی مرورگر در Linux](/fa/tools/browser-linux-troubleshooting)
- [عیب‌یابی مرورگر در WSL2](/fa/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
