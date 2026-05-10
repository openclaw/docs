---
read_when:
    - آماده‌سازی گزارش اشکال یا درخواست پشتیبانی
    - اشکال‌زدایی از ازکارافتادگی‌های Gateway، راه‌اندازی‌های مجدد، فشار حافظه یا بارهای دادهٔ بیش‌ازحد بزرگ
    - بررسی اینکه کدام داده‌های تشخیصی ثبت یا پنهان‌سازی می‌شوند
summary: بسته‌های عیب‌یابی قابل اشتراک‌گذاری Gateway را برای گزارش‌های اشکال ایجاد کنید
title: صدور داده‌های عیب‌یابی
x-i18n:
    generated_at: "2026-05-10T19:42:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw می‌تواند برای گزارش‌های باگ یک فایل zip تشخیصی محلی ایجاد کند. این فایل
وضعیت، سلامت، لاگ‌ها، شکل پیکربندی و رویدادهای پایداری اخیر بدون payload و
پاک‌سازی‌شدهٔ Gateway را ترکیب می‌کند.

بسته‌های تشخیصی را تا زمانی که آن‌ها را بازبینی نکرده‌اید مانند رازها در نظر
بگیرید. این بسته‌ها طوری طراحی شده‌اند که payloadها و اعتبارنامه‌ها را حذف یا
پنهان کنند، اما همچنان لاگ‌های محلی Gateway و وضعیت runtime در سطح میزبان را
خلاصه می‌کنند.

## شروع سریع

```bash
openclaw gateway diagnostics export
```

این فرمان مسیر zip نوشته‌شده را چاپ می‌کند. برای انتخاب مسیر:

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

برای اتوماسیون:

```bash
openclaw gateway diagnostics export --json
```

## فرمان چت

مالکان می‌توانند در چت از `/diagnostics [note]` برای درخواست export محلی Gateway
استفاده کنند. وقتی باگ در یک مکالمهٔ واقعی رخ داده و یک گزارش قابل copy-paste
برای پشتیبانی می‌خواهید، از این استفاده کنید:

1. در مکالمه‌ای که مشکل را در آن دیدید، `/diagnostics` را بفرستید. اگر کمک
   می‌کند، یک یادداشت کوتاه اضافه کنید، برای مثال `/diagnostics bad tool choice`.
2. OpenClaw پیش‌گفتار diagnostics را می‌فرستد و یک تأیید صریح exec درخواست
   می‌کند. این تأیید `openclaw gateway diagnostics export --json` را اجرا می‌کند.
   diagnostics را از طریق قاعدهٔ allow-all تأیید نکنید.
3. پس از تأیید، OpenClaw با گزارشی قابل paste پاسخ می‌دهد که شامل مسیر بستهٔ
   محلی، خلاصهٔ manifest، نکات حریم خصوصی و شناسه‌های session مرتبط است.

در چت‌های گروهی، مالک همچنان می‌تواند `/diagnostics` را اجرا کند، اما OpenClaw
جزئیات تشخیصی را دوباره در چت مشترک منتشر نمی‌کند. پیش‌گفتار، promptهای تأیید،
نتیجهٔ export در Gateway و تفکیک session/thread مربوط به Codex را از مسیر تأیید
خصوصی برای مالک می‌فرستد. گروه فقط یک اعلان کوتاه دریافت می‌کند که جریان
diagnostics به‌صورت خصوصی ارسال شده است. اگر OpenClaw نتواند مسیر خصوصی مالک را
پیدا کند، فرمان به‌صورت بسته شکست می‌خورد و از مالک می‌خواهد آن را از یک DM اجرا
کند.

وقتی session فعال OpenClaw از هارنس بومی OpenAI Codex استفاده می‌کند، همان تأیید
exec یک بارگذاری بازخورد OpenAI را نیز برای threadهای runtime مربوط به Codex که
OpenClaw از آن‌ها خبر دارد پوشش می‌دهد. این بارگذاری از zip محلی Gateway جدا است
و فقط برای sessionهای هارنس Codex ظاهر می‌شود. پیش از تأیید، prompt توضیح می‌دهد
که تأیید diagnostics بازخورد Codex را نیز ارسال می‌کند، اما شناسه‌های session یا
thread مربوط به Codex را فهرست نمی‌کند. پس از تأیید، پاسخ چت channelها،
شناسه‌های session در OpenClaw، شناسه‌های thread در Codex و فرمان‌های resume محلی
را برای threadهایی که به سرورهای OpenAI ارسال شده‌اند فهرست می‌کند. اگر تأیید را
رد یا نادیده بگیرید، OpenClaw export را اجرا نمی‌کند، بازخورد Codex را نمی‌فرستد
و شناسه‌های Codex را چاپ نمی‌کند.

این کار چرخهٔ رایج اشکال‌زدایی Codex را کوتاه می‌کند: رفتار بد را در Telegram،
Discord یا channel دیگری ببینید، `/diagnostics` را اجرا کنید، یک بار تأیید کنید،
گزارش را با پشتیبانی به اشتراک بگذارید، سپس اگر می‌خواهید thread بومی Codex را
خودتان بررسی کنید، فرمان چاپ‌شدهٔ `codex resume <thread-id>` را به‌صورت محلی
اجرا کنید. برای آن جریان بررسی، [هارنس Codex](/fa/plugins/codex-harness#inspect-codex-threads-locally)
را ببینید.

## export شامل چه چیزهایی است

zip شامل این موارد است:

- `summary.md`: نمای کلی خوانا برای انسان، برای پشتیبانی.
- `diagnostics.json`: خلاصهٔ خوانا برای ماشین از پیکربندی، لاگ‌ها، وضعیت، سلامت
  و داده‌های پایداری.
- `manifest.json`: metadata مربوط به export و فهرست فایل‌ها.
- شکل پیکربندی پاک‌سازی‌شده و جزئیات غیرمحرمانهٔ پیکربندی.
- خلاصه‌های لاگ پاک‌سازی‌شده و خط‌های اخیر لاگ با اطلاعات پنهان‌شده.
- snapshotهای best-effort از وضعیت و سلامت Gateway.
- `stability/latest.json`: جدیدترین بستهٔ پایداری persistشده، وقتی موجود باشد.

export حتی وقتی Gateway ناسالم است هم مفید است. اگر Gateway نتواند به درخواست‌های
وضعیت یا سلامت پاسخ دهد، لاگ‌های محلی، شکل پیکربندی و جدیدترین بستهٔ پایداری در
صورت موجود بودن همچنان جمع‌آوری می‌شوند.

## مدل حریم خصوصی

diagnostics طوری طراحی شده‌اند که قابل اشتراک‌گذاری باشند. export داده‌های
عملیاتی کمک‌کننده به اشکال‌زدایی را نگه می‌دارد، مانند:

- نام‌های subsystem، شناسه‌های plugin، شناسه‌های provider، شناسه‌های channel و modeهای پیکربندی‌شده
- کدهای وضعیت، مدت‌زمان‌ها، شمارش byte، وضعیت صف و خوانش‌های memory
- metadata لاگ پاک‌سازی‌شده و پیام‌های عملیاتی با اطلاعات پنهان‌شده
- شکل پیکربندی و تنظیمات غیرمحرمانهٔ قابلیت‌ها

export این موارد را حذف یا پنهان می‌کند:

- متن چت، promptها، دستورالعمل‌ها، بدنه‌های webhook و خروجی‌های tool
- اعتبارنامه‌ها، API keyها، tokenها، cookieها و مقدارهای محرمانه
- بدنه‌های خام request یا response
- شناسه‌های account، شناسه‌های message، شناسه‌های خام session، hostnameها و نام‌های کاربری محلی

وقتی یک پیام لاگ شبیه متن user، chat، prompt یا payload ابزار باشد، export فقط
این را نگه می‌دارد که یک پیام حذف شده و شمارش byte آن چقدر بوده است.

## ضبط‌کنندهٔ پایداری

Gateway به‌صورت پیش‌فرض، وقتی diagnostics فعال است، یک جریان پایداری محدود و
بدون payload ضبط می‌کند. این برای واقعیت‌های عملیاتی است، نه محتوا.

همان Heartbeat تشخیصی وقتی Gateway همچنان در حال اجرا است اما event loop یا CPU
در Node.js اشباع به نظر می‌رسد، نمونه‌های liveness را ضبط می‌کند. این رویدادهای
`diagnostic.liveness.warning` شامل تأخیر event-loop، بهره‌برداری event-loop،
نسبت CPU-core، شمارش sessionهای active/waiting/queued، فاز فعلی startup/runtime
وقتی معلوم باشد، spanهای اخیر فاز و برچسب‌های محدود active/queued work هستند.
نمونه‌های idle در telemetry با سطح `info` می‌مانند. نمونه‌های liveness فقط وقتی
به هشدارهای Gateway تبدیل می‌شوند که کاری waiting یا queued باشد، یا وقتی کار
active با تأخیر پایدار event-loop هم‌پوشانی داشته باشد. جهش‌های گذرای max-delay
در طول کار پس‌زمینهٔ سالم، در لاگ‌های debug می‌مانند. این‌ها به‌تنهایی Gateway را
restart نمی‌کنند.

فازهای startup همچنین رویدادهای `diagnostic.phase.completed` را با زمان‌بندی
wall-clock و CPU منتشر می‌کنند. diagnostics مربوط به embedded-run متوقف‌شده وقتی
آخرین پیشرفت bridge ترمینال به نظر می‌رسید، مانند یک آیتم response خام یا رویداد
تکمیل response، اما Gateway همچنان embedded run را active در نظر می‌گیرد،
`terminalProgressStale=true` را علامت می‌زنند.

ضبط‌کنندهٔ زنده را بررسی کنید:

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

پس از fatal exit، shutdown timeout یا شکست startup پس از restart، جدیدترین بستهٔ
پایداری persistشده را بررسی کنید:

```bash
openclaw gateway stability --bundle latest
```

از جدیدترین بستهٔ persistشده یک zip تشخیصی ایجاد کنید:

```bash
openclaw gateway stability --bundle latest --export
```

بسته‌های persistشده وقتی رویدادهایی وجود داشته باشند، زیر `~/.openclaw/logs/stability/`
قرار دارند.

## گزینه‌های مفید

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>`: در یک مسیر zip مشخص بنویس.
- `--log-lines <count>`: بیشینهٔ خط‌های لاگ پاک‌سازی‌شده برای درج.
- `--log-bytes <bytes>`: بیشینهٔ byteهای لاگ برای بررسی.
- `--url <url>`: URL مربوط به WebSocket در Gateway برای snapshotهای وضعیت و سلامت.
- `--token <token>`: token مربوط به Gateway برای snapshotهای وضعیت و سلامت.
- `--password <password>`: گذرواژهٔ Gateway برای snapshotهای وضعیت و سلامت.
- `--timeout <ms>`: timeout مربوط به snapshot وضعیت و سلامت.
- `--no-stability-bundle`: جست‌وجوی بستهٔ پایداری persistشده را رد کن.
- `--json`: metadata مربوط به export را به‌شکل خوانا برای ماشین چاپ کن.

## غیرفعال‌سازی diagnostics

diagnostics به‌صورت پیش‌فرض فعال است. برای غیرفعال‌سازی ضبط‌کنندهٔ پایداری و
جمع‌آوری رویدادهای تشخیصی:

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

غیرفعال‌سازی diagnostics جزئیات گزارش باگ را کاهش می‌دهد. این کار روی لاگ‌گیری
عادی Gateway اثری ندارد.

## مرتبط

- [بررسی‌های سلامت](/fa/gateway/health)
- [CLI مربوط به Gateway](/fa/cli/gateway#gateway-diagnostics-export)
- [پروتکل Gateway](/fa/gateway/protocol#system-and-identity)
- [لاگ‌گیری](/fa/logging)
- [export در OpenTelemetry](/fa/gateway/opentelemetry) — جریان جداگانه برای stream کردن diagnostics به یک collector
