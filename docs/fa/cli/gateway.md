---
read_when:
    - اجرای Gateway از طریق CLI (محیط توسعه یا سرورها)
    - اشکال‌زدایی احراز هویت Gateway، حالت‌های اتصال و ارتباط‌پذیری
    - کشف Gatewayها از طریق Bonjour (محلی + DNS-SD گسترده)
sidebarTitle: Gateway
summary: CLI Gateway در OpenClaw (`openclaw gateway`) — اجرا، پرس‌وجو و کشف Gatewayها
title: Gateway
x-i18n:
    generated_at: "2026-07-12T09:50:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 75f8f4bebe585b213f486f08bf20015aeb89ca4d179f6d96c1008ec9d1cd00ea
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket در OpenClaw است (کانال‌ها، Nodeها، نشست‌ها، هوک‌ها). همهٔ زیرفرمان‌های زیر در `openclaw gateway ...` قرار دارند.

<CardGroup cols={3}>
  <Card title="کشف Bonjour" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="نمای کلی کشف" href="/fa/gateway/discovery">
    نحوهٔ معرفی و یافتن Gatewayها توسط OpenClaw.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration">
    کلیدهای سطح‌بالای پیکربندی Gateway.
  </Card>
</CardGroup>

## اجرای Gateway

```bash
openclaw gateway
openclaw gateway run   # شکل صریح و معادل
```

<AccordionGroup>
  <Accordion title="رفتار هنگام راه‌اندازی">
    - تا زمانی که `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم نشده باشد، از شروع خودداری می‌کند. برای اجراهای موقت/توسعه از `--allow-unconfigured` استفاده کنید؛ این گزینه بدون نوشتن یا ترمیم پیکربندی، بررسی محافظ را دور می‌زند.
    - `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را می‌نویسند. اگر فایل پیکربندی وجود داشته باشد اما `gateway.mode` در آن نباشد، پیکربندی آسیب‌دیده/بازنویسی‌شده تلقی می‌شود و Gateway از حدس‌زدن مقدار `local` برای شما خودداری می‌کند — فرایند راه‌اندازی اولیه را دوباره اجرا کنید، کلید را دستی تنظیم کنید، یا `--allow-unconfigured` را بدهید.
    - اتصال به محدوده‌ای فراتر از loopback بدون احراز هویت مسدود می‌شود.
    - مقادیر `lan`،‏ `tailnet` و `custom` برای `--bind` در حال حاضر فقط از مسیرهای IPv4 تفکیک می‌شوند؛ راه‌اندازی‌های میزبان سفارشیِ صرفاً IPv6 به یک سرویس جانبی IPv4 یا پراکسی در جلوی Gateway نیاز دارند.
    - در صورت مجاز بودن، `SIGUSR1` راه‌اندازی مجدد درون‌فرایندی را فعال می‌کند. `commands.restart` (پیش‌فرض: فعال) دریافت `SIGUSR1` از بیرون را کنترل می‌کند؛ برای مسدودکردن راه‌اندازی مجدد دستی از طریق سیگنال سیستم‌عامل، در حالی که راه‌اندازی مجدد از طریق فرمان `gateway restart`، ابزار Gateway و اعمال/به‌روزرسانی پیکربندی همچنان مجاز است، آن را روی `false` تنظیم کنید.
    - `SIGINT`/`SIGTERM` فرایند را متوقف می‌کنند، اما وضعیت سفارشی ترمینال را بازیابی نمی‌کنند — اگر CLI را در یک TUI یا ورودی حالت خام بسته‌بندی می‌کنید، پیش از خروج خودتان ترمینال را بازیابی کنید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  درگاه WebSocket (مقدار پیش‌فرض از پیکربندی/متغیر محیطی؛ معمولاً `18789`).
</ParamField>
<ParamField path="--bind <mode>" type="string">
  حالت اتصال: `loopback` (پیش‌فرض)، `lan`،‏ `tailnet`،‏ `auto`،‏ `custom`.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن مشترک برای `connect.params.auth.token`. در صورت تنظیم، مقدار پیش‌فرض از `OPENCLAW_GATEWAY_TOKEN` گرفته می‌شود.
</ParamField>
<ParamField path="--auth <mode>" type="string">
  حالت احراز هویت: `none`،‏ `token`،‏ `password`،‏ `trusted-proxy`.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه برای `--auth password`.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  خواندن گذرواژهٔ Gateway از یک فایل.
</ParamField>
<ParamField path="--tailscale <mode>" type="string">
  نحوهٔ در معرض قرار دادن Tailscale: `off`،‏ `serve`،‏ `funnel`.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  بازنشانی پیکربندی serve/funnel در Tailscale هنگام خاموش‌شدن.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  شروع بدون الزام `gateway.mode=local`. فقط برای راه‌اندازی موقت/توسعه؛ پیکربندی را ذخیره یا ترمیم نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  در صورت نبود، پیکربندی توسعه + فضای کاری ایجاد می‌کند (`BOOTSTRAP.md` را نادیده می‌گیرد).
</ParamField>
<ParamField path="--reset" type="boolean">
  بازنشانی پیکربندی توسعه، اطلاعات اعتبارسنجی، نشست‌ها و فضای کاری. به `--dev` نیاز دارد.
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنوندهٔ موجود روی درگاه مقصد را متوقف می‌کند.
</ParamField>
<ParamField path="--verbose" type="boolean">
  ثبت گزارش تفصیلی در stdout/stderr.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط گزارش‌های بخش پشتی CLI را در کنسول نمایش می‌دهد (stdout/stderr را نیز فعال می‌کند).
</ParamField>
<ParamField path="--ws-log <style>" type="string" default="auto">
  سبک گزارش WebSocket: `auto`،‏ `full`،‏ `compact`.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  ثبت رویدادهای خام جریان مدل در JSONL.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر JSONL جریان خام.
</ParamField>

`--claude-cli-logs` نام مستعار منسوخ‌شدهٔ `--cli-backend-logs` است.

برای `--bind custom`، مقدار `gateway.customBindHost` را روی یک نشانی IPv4 تنظیم کنید. هر نشانی به‌جز `127.0.0.1` یا `0.0.0.0` برای کلاینت‌های همان میزبان، به `127.0.0.1` روی همان درگاه نیز نیاز دارد؛ اگر هرکدام از شنونده‌ها نتواند متصل شود، راه‌اندازی ناموفق خواهد بود. نویسهٔ عام `0.0.0.0` نام مستعار الزامی جداگانه‌ای اضافه نمی‌کند. راه‌اندازی‌های میزبان سفارشیِ صرفاً IPv6 به یک سرویس جانبی IPv4 یا پراکسی در جلوی Gateway نیاز دارند.

## راه‌اندازی مجدد Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
openclaw gateway restart --wait 30s
```

`--safe` از Gateway در حال اجرا می‌خواهد کارهای فعال را پیش‌بررسی کند و پس از تخلیهٔ آن کارها، یک راه‌اندازی مجدد تجمیع‌شده را زمان‌بندی کند. انتظار با `gateway.reload.deferralTimeoutMs` محدود می‌شود (پیش‌فرض: ۵ دقیقه / `300000`)؛ پس از پایان مهلت، راه‌اندازی مجدد به‌اجبار انجام می‌شود. برای انتظار نامحدود (همراه با هشدارهای دوره‌ای دربارهٔ ادامهٔ انتظار) به‌جای اجبار، مقدار `deferralTimeoutMs: 0` را تنظیم کنید. `--safe` را نمی‌توان با `--force` یا `--wait` ترکیب کرد.

`--skip-deferral` در یک راه‌اندازی مجدد امن، دروازهٔ تعویق کارهای فعال را دور می‌زند؛ بنابراین Gateway حتی در صورت گزارش موانع، فوراً راه‌اندازی مجدد می‌شود. این گزینه به `--safe` نیاز دارد — زمانی از آن استفاده کنید که تعویق روی یک وظیفهٔ مهارنشده گیر کرده باشد.

`--wait <duration>` مهلت تخلیه را برای یک راه‌اندازی مجدد عادی (غیرامن) بازنویسی می‌کند. میلی‌ثانیهٔ بدون پسوند یا پسوندهای واحد `ms`،‏ `s`،‏ `m`،‏ `h`،‏ `d` را می‌پذیرد (برای نمونه `30s`،‏ `5m`،‏ `1h30m`)؛ `--wait 0` به‌طور نامحدود منتظر می‌ماند. با `--force` یا `--safe` سازگار نیست.

`--force` تخلیهٔ کارهای فعال را نادیده می‌گیرد و فوراً راه‌اندازی مجدد می‌کند. `restart` عادی (بدون پرچم) رفتار موجود راه‌اندازی مجددِ مدیر سرویس را حفظ می‌کند.

<Warning>
گذرواژهٔ درون‌خطی `--password` ممکن است در فهرست فرایندهای محلی آشکار شود. استفاده از `--password-file`، متغیر محیطی، یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری Gateway

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` زمان‌بندی مرحله‌ها را هنگام راه‌اندازی ثبت می‌کند، از جمله تأخیر `eventLoopMax` هر مرحله و زمان‌بندی جدول جست‌وجوی Pluginها (نمایهٔ نصب‌شده، رجیستری مانیفست، برنامه‌ریزی راه‌اندازی، کارهای نگاشت مالک).
- `OPENCLAW_GATEWAY_RESTART_TRACE=1` خطوط `restart trace:` محدود به راه‌اندازی مجدد را ثبت می‌کند: مدیریت سیگنال، تخلیهٔ کارهای فعال، مرحله‌های خاموش‌سازی، شروع بعدی، زمان آماده‌شدن و معیارهای حافظه.
- `OPENCLAW_DIAGNOSTICS=timeline` همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` یک خط زمانی تشخیصی راه‌اندازی با قالب JSONL و بر مبنای بیشترین تلاش ممکن برای چارچوب‌های QA خارجی می‌نویسد (معادل پیکربندی `diagnostics.flags: ["timeline"]`؛ مسیر همچنان فقط از طریق متغیر محیطی تعیین می‌شود). برای افزودن نمونه‌های حلقهٔ رویداد، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- اجرای `pnpm build` و سپس `pnpm test:startup:gateway -- --runs 5 --warmup 1` راه‌اندازی Gateway را با نقطهٔ ورود CLI ساخته‌شده محک می‌زند: نخستین خروجی فرایند، `/healthz`،‏ `/readyz`، زمان‌بندی ردگیری راه‌اندازی، تأخیر حلقهٔ رویداد و زمان‌بندی جدول جست‌وجوی Plugin.
- اجرای `pnpm build` و سپس `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5` راه‌اندازی مجدد درون‌فرایندی را روی macOS یا Linux محک می‌زند (در Windows پشتیبانی نمی‌شود؛ راه‌اندازی مجدد به `SIGUSR1` نیاز دارد). از `SIGUSR1` استفاده می‌کند، هر دو ردگیری را در فرایند فرزند فعال می‌کند و `/healthz` بعدی، `/readyz` بعدی، مدت ازکارافتادگی، زمان آماده‌شدن، CPU،‏ RSS و معیارهای ردگیری راه‌اندازی مجدد را ثبت می‌کند.
- `/healthz` نشان‌دهندهٔ زنده‌بودن است؛ `/readyz` نشان‌دهندهٔ آمادگی قابل‌استفاده است. خطوط ردگیری و خروجی محک را نشانه‌ای برای انتساب به مالک در نظر بگیرید، نه نتیجه‌گیری کامل دربارهٔ کارایی بر اساس یک بازه یا نمونه.

## پرس‌وجو از یک Gateway در حال اجرا

همهٔ فرمان‌های پرس‌وجو از RPC مبتنی بر WebSocket استفاده می‌کنند.

<Tabs>
  <Tab title="حالت‌های خروجی">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`:‏ JSON قابل‌خواندن برای ماشین (بدون سبک‌دهی/نشانگر چرخان).
    - `--no-color` (یا `NO_COLOR=1`): غیرفعال‌کردن ANSI با حفظ چیدمان خوانا برای انسان.

  </Tab>
  <Tab title="گزینه‌های مشترک">
    - `--url <url>`: نشانی WebSocket مربوط به Gateway.
    - `--token <token>`: توکن Gateway.
    - `--password <password>`: گذرواژهٔ Gateway.
    - `--timeout <ms>`: مهلت/بودجهٔ زمانی (پیش‌فرض برای هر فرمان متفاوت است؛ توضیحات هر فرمان را در ادامه ببینید).
    - `--expect-final`: انتظار برای پاسخ «نهایی» (فراخوانی‌های عامل).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI برای اطلاعات اعتبارسنجی به پیکربندی یا متغیرهای محیطی بازنمی‌گردد. `--token` یا `--password` را صریحاً وارد کنید. نبود اطلاعات اعتبارسنجی صریح خطا است.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
openclaw gateway health --port 18789
```

`/healthz` یک کاوشگر زنده‌بودن است: به‌محض اینکه سرور بتواند به HTTP پاسخ دهد، برمی‌گردد. `/readyz` سخت‌گیرانه‌تر است و تا زمانی که سرویس‌های جانبی Plugin، کانال‌ها یا هوک‌های پیکربندی‌شدهٔ راه‌اندازی هنوز در حال پایدارشدن باشند، قرمز باقی می‌ماند. پاسخ‌های تفصیلی محلی یا احرازهویت‌شدهٔ `/readyz` شامل یک بلوک تشخیصی `eventLoop` هستند (تأخیر، میزان استفاده، نسبت هستهٔ CPU، پرچم `degraded`).

<ParamField path="--port <port>" type="number">
  یک Gateway روی local loopback را در این درگاه هدف قرار می‌دهد. برای این فراخوانی، `OPENCLAW_GATEWAY_URL` و `OPENCLAW_GATEWAY_PORT` را بازنویسی می‌کند.
</ParamField>

### `gateway usage-cost`

خلاصه‌های هزینهٔ مصرف را از گزارش‌های نشست دریافت می‌کند.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --agent work --json
openclaw gateway usage-cost --all-agents
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید لحاظ شوند.
</ParamField>
<ParamField path="--agent <id>" type="string">
  محدودهٔ خلاصه را به شناسهٔ یک عامل پیکربندی‌شده محدود می‌کند.
</ParamField>
<ParamField path="--all-agents" type="boolean">
  تجمیع در میان همهٔ عامل‌های پیکربندی‌شده. با `--agent` قابل‌ترکیب نیست.
</ParamField>

### `gateway stability`

ثبت‌کنندهٔ اخیر پایداری تشخیصی را از یک Gateway در حال اجرا دریافت می‌کند.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  حداکثر رویدادهای اخیر برای لحاظ‌کردن (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  پالایش بر اساس نوع رویداد تشخیصی، برای نمونه `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای پس از یک شمارهٔ توالی تشخیصی را لحاظ می‌کند.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک بستهٔ پایداری ذخیره‌شده را می‌خواند. `--bundle latest` (یا `--bundle` بدون مقدار) جدیدترین بسته را در پوشهٔ وضعیت انتخاب می‌کند؛ همچنین می‌توانید مسیر JSON یک بسته را مستقیماً وارد کنید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک فایل zip تشخیصی قابل‌اشتراک برای پشتیبانی می‌نویسد.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="حریم خصوصی و رفتار بسته">
    - رکوردها فرادادهٔ عملیاتی را نگه می‌دارند: نام رویدادها، تعدادها، اندازه‌های بایتی، خوانش‌های حافظه، وضعیت صف/نشست، شناسه‌های تأیید، نام کانال/Plugin و خلاصه‌های ویرایش‌شدهٔ نشست. متن گفت‌وگو، بدنه‌های Webhook، خروجی ابزارها، بدنهٔ خام درخواست/پاسخ، توکن‌ها، کوکی‌ها، مقادیر محرمانه، نام میزبان‌ها و شناسه‌های خام نشست در آن‌ها قرار نمی‌گیرد. برای غیرفعال‌کردن کامل ثبت‌کننده، `diagnostics.enabled: false` را تنظیم کنید.
    - خروج‌های مرگبار Gateway، پایان مهلت خاموش‌سازی و شکست‌های راه‌اندازی پس از راه‌اندازی مجدد، هنگامی که ثبت‌کننده رویدادی داشته باشد، همان تصویر لحظه‌ای تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسند. جدیدترین بسته را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`،‏ `--type` و `--since-seq` بر خروجی بسته نیز اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک فایل zip تشخیصی محلی می‌نویسد که برای گزارش خطا طراحی شده است. برای مدل حریم خصوصی و محتوای بسته، [برون‌بری اطلاعات تشخیصی](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر فایل zip خروجی. به‌طور پیش‌فرض، یک خروجی پشتیبانی در پوشهٔ وضعیت ایجاد می‌شود.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  حداکثر تعداد خطوط پالایش‌شدهٔ گزارش که گنجانده می‌شوند.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  حداکثر تعداد بایت‌های گزارش برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  نشانی WebSocket مربوط به Gateway برای تصویر لحظه‌ای سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway برای تصویر لحظه‌ای سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژهٔ Gateway برای تصویر لحظه‌ای سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  مهلت زمانی تصویر لحظه‌ای وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  از جست‌وجوی بستهٔ پایداری ذخیره‌شده صرف‌نظر می‌کند.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه و مانیفست را به‌صورت JSON چاپ می‌کند.
</ParamField>

خروجی شامل این موارد است: `manifest.json` (فهرست فایل‌ها)، `summary.md` (خلاصهٔ Markdown)، `diagnostics.json` (خلاصهٔ سطح‌بالای پیکربندی/گزارش‌ها/کشف/پایداری/وضعیت/سلامت)، `config/sanitized.json`، `status/gateway-status.json`، `health/gateway-health.json`، `logs/openclaw-sanitized.jsonl` و در صورت وجود بسته، `stability/latest.json`.

این خروجی برای اشتراک‌گذاری طراحی شده است. جزئیات عملیاتی مفید برای اشکال‌زدایی را نگه می‌دارد — فیلدهای امن گزارش، نام زیرسامانه‌ها، کدهای وضعیت، مدت‌زمان‌ها، حالت‌های پیکربندی‌شده، درگاه‌ها، شناسه‌های Plugin/ارائه‌دهنده، تنظیمات غیرمحرمانهٔ قابلیت‌ها و پیام‌های عملیاتی گزارش با بخش‌های پوشانده‌شده — و متن گفت‌وگو، بدنه‌های Webhook، خروجی ابزارها، اطلاعات احراز هویت، کوکی‌ها، شناسه‌های حساب/پیام، متن اعلان/دستورالعمل، نام‌های میزبان و مقادیر محرمانه را حذف یا پوشانده می‌کند. وقتی یک پیام گزارش شبیه متن بارِ کاربر/گفت‌وگو/ابزار باشد (برای مثال «کاربر گفت»، «متن گفت‌وگو»، «خروجی ابزار»، «بدنهٔ Webhook»)، خروجی فقط این واقعیت را نگه می‌دارد که پیامی حذف شده است، به‌همراه تعداد بایت‌های آن.

### `gateway status`

سرویس Gateway ‏(launchd/systemd/schtasks) را به‌همراه یک وارسی اختیاری اتصال/احراز هویت نمایش می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک مقصد صریح برای وارسی اضافه می‌کند. مقصد راه‌دور پیکربندی‌شده و localhost همچنان وارسی می‌شوند.
</ParamField>
<ParamField path="--token <token>" type="string">
  احراز هویت توکنی برای وارسی.
</ParamField>
<ParamField path="--password <password>" type="string">
  احراز هویت با گذرواژه برای وارسی.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  مهلت زمانی وارسی.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  از وارسی اتصال صرف‌نظر می‌کند (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را نیز اسکن می‌کند.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  وارسی اتصال را به وارسی خواندن ارتقا می‌دهد و در صورت شکست با کد غیرصفر خارج می‌شود. نمی‌توان آن را با `--no-probe` ترکیب کرد.
</ParamField>

<AccordionGroup>
  <Accordion title="معنای وضعیت">
    - حتی در صورت نبودن یا نامعتبر بودن پیکربندی محلی CLI، برای عیب‌یابی در دسترس می‌ماند.
    - خروجی پیش‌فرض وضعیت سرویس، اتصال WebSocket و قابلیت احراز هویت قابل مشاهده هنگام دست‌دهی را اثبات می‌کند — نه عملیات خواندن/نوشتن/مدیریتی را.
    - وارسی‌ها برای احراز هویت نخستین‌بار دستگاه تغییری ایجاد نمی‌کنند: در صورت وجود توکن ذخیره‌شدهٔ دستگاه، دوباره از آن استفاده می‌کنند، اما صرفاً برای بررسی وضعیت هرگز هویت جدید دستگاه CLI یا سابقهٔ جفت‌سازی فقط‌خواندنی ایجاد نمی‌کنند.
    - در صورت امکان، SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت وارسی برطرف می‌کند. اگر SecretRef الزامی حل‌نشده باشد، هنگام شکست اتصال/احراز هویت وارسی، `--json` مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریحاً ارائه کنید یا منبع راز را اصلاح کنید. پس از موفقیت وارسی، هشدارهای احراز هویت حل‌نشده سرکوب می‌شوند.
    - وقتی Gateway در حال اجرا نسخهٔ خود را گزارش کند، خروجی JSON شامل `gateway.version` است؛ اگر وارسی دست‌دهی نتواند فرادادهٔ نسخه را ارائه کند، `--require-rpc` می‌تواند از بار RPC مربوط به `status.runtimeVersion` استفاده کند.
    - در اسکریپت‌ها/خودکارسازی، زمانی از `--require-rpc` استفاده کنید که صرفاً گوش‌دادن سرویس کافی نیست و لازم است RPC با دامنهٔ خواندن نیز سالم باشد.
    - `--deep` نصب‌های اضافی launchd/systemd/schtasks را اسکن می‌کند؛ وقتی چند سرویس شبیه Gateway پیدا شود، خروجی خوانا برای انسان راهنمای پاک‌سازی را چاپ می‌کند (معمولاً در هر دستگاه یک Gateway اجرا کنید) و در صورت مرتبط بودن، تحویل اخیرِ راه‌اندازی مجدد ناظر را گزارش می‌دهد.
    - `--deep` همچنین اعتبارسنجی پیکربندی را در حالت آگاه از Plugin ‏(`pluginValidation: "full"`) اجرا می‌کند و هشدارهای مانیفست Plugin را آشکار می‌سازد (برای مثال نبود فرادادهٔ پیکربندی کانال). حالت پیش‌فرض `gateway status` مسیر سریع فقط‌خواندنی را حفظ می‌کند که از اعتبارسنجی Plugin صرف‌نظر می‌کند.
    - خروجی خوانا برای انسان شامل مسیر حل‌شدهٔ فایل گزارش و نیز مسیرها/اعتبار پیکربندی CLI در مقایسه با سرویس است تا به تشخیص اختلاف پروفایل یا پوشهٔ وضعیت کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های اختلاف احراز هویت systemd در Linux">
    - بررسی اختلاف احراز هویت سرویس، هم `Environment=` و هم `EnvironmentFile=` را از واحد می‌خواند (از جمله `%h`، مسیرهای نقل‌قول‌شده، چند فایل و فایل‌های اختیاری دارای `-`).
    - SecretRef مربوط به `gateway.auth.token` را با استفاده از محیط زمان اجرا ادغام‌شده برطرف می‌کند (ابتدا محیط فرمان سرویس، سپس محیط فرایند به‌عنوان گزینهٔ جایگزین).
    - وقتی احراز هویت توکنی عملاً فعال نیست، بررسی‌های اختلاف توکن از حل توکن پیکربندی صرف‌نظر می‌کنند (`gateway.auth.mode` صریحاً برابر `password`/`none`/`trusted-proxy` است، یا حالت تنظیم نشده و گذرواژه می‌تواند اولویت یابد و هیچ توکن نامزدی نمی‌تواند برنده شود).

  </Accordion>
</AccordionGroup>

### `gateway probe`

فرمان «اشکال‌زدایی همه‌چیز». این فرمان همیشه موارد زیر را وارسی می‌کند:

- Gateway راه‌دور پیکربندی‌شدهٔ شما (در صورت تنظیم)، و
- localhost ‏(local loopback)، **حتی اگر مقصد راه‌دور پیکربندی شده باشد**.

ارائهٔ `--url` آن مقصد صریح را پیش از هر دو اضافه می‌کند. خروجی خوانا برای انسان، مقصدها را با `URL (explicit)`،‏ `Remote (configured)` / `Remote (configured, inactive)` و `Local loopback` برچسب‌گذاری می‌کند.

<Note>
اگر چند مقصد وارسی قابل دسترسی باشند، همه چاپ می‌شوند. یک تونل SSH، نشانی TLS/پروکسی و نشانی راه‌دور پیکربندی‌شده می‌توانند حتی با درگاه‌های انتقال متفاوت به یک Gateway اشاره کنند؛ `multiple_gateways` برای Gatewayهای قابل دسترسیِ متمایز یا دارای هویت مبهم در نظر گرفته شده است. اجرای چند Gateway برای پروفایل‌های ایزوله پشتیبانی می‌شود (برای مثال یک ربات نجات)، اما بیشتر نصب‌ها یک Gateway اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --port 18789
```

<ParamField path="--port <port>" type="number">
  از این درگاه برای مقصد وارسی local loopback و درگاه راه‌دور تونل SSH استفاده می‌کند. بدون `--url`، به‌جای نشانی محیطی Gateway پیکربندی‌شده، درگاه محیطی یا مقصدهای راه‌دور، فقط مقصد local loopback را انتخاب می‌کند.
</ParamField>

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی دست‌کم یک مقصد، اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` آنچه وارسی توانسته دربارهٔ احراز هویت اثبات کند گزارش می‌دهد، مستقل از دسترس‌پذیری.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با دامنهٔ خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق بوده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق بوده، اما RPC با دامنهٔ خواندن محدود است. این وضعیت به‌صورت دسترس‌پذیری **تنزل‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` پس از `Connect: ok` یعنی WebSocket متصل شده، اما عیب‌یابی خواندنِ پس از آن منقضی شده یا شکست خورده است — این نیز **تنزل‌یافته** است، نه غیرقابل دسترسی.
    - مانند `gateway status`، وارسی از احراز هویت ذخیره‌شدهٔ موجود دستگاه دوباره استفاده می‌کند، اما هویت نخستین‌بار دستگاه یا وضعیت جفت‌سازی ایجاد نمی‌کند.
    - کد خروج فقط زمانی غیرصفر است که هیچ‌یک از مقصدهای وارسی‌شده قابل دسترسی نباشند.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: دست‌کم یک مقصد قابل دسترسی است.
    - `degraded`: دست‌کم یک مقصد اتصال را پذیرفته، اما عیب‌یابی کامل RPC جزئیات را به پایان نرسانده است.
    - `capability`: بهترین قابلیت مشاهده‌شده میان مقصدهای قابل دسترسی (`read_only`،‏ `write_capable`،‏ `admin_capable`،‏ `pairing_pending`،‏ `connected_no_operator_scope` یا `unknown`).
    - `primaryTargetId`: بهترین مقصدی که باید به‌عنوان برندهٔ فعال در نظر گرفته شود، به این ترتیب: نشانی صریح، تونل SSH، مقصد راه‌دور پیکربندی‌شده، local loopback.
    - `warnings[]`: رکوردهای هشدار بر پایهٔ بهترین تلاش، شامل `code`،‏ `message` و `targetIds` اختیاری.
    - `network`: راهنمای نشانی local loopback/tailnet که از پیکربندی فعلی و شبکهٔ میزبان استخراج شده است.
    - `discovery.timeoutMs` / `discovery.count`: بودجهٔ واقعی کشف/تعداد نتایج استفاده‌شده برای این نوبت وارسی.

    برای هر مقصد (`targets[].connect`):‏ `ok` (دسترس‌پذیری + دسته‌بندی تنزل‌یافته)،‏ `rpcOk` (موفقیت کامل RPC جزئیات)،‏ `scopeLimited` (شکست RPC جزئیات به‌دلیل نبود دامنهٔ عملگر).

    برای هر مقصد (`targets[].auth`):‏ `role` و `scopes` گزارش‌شده در `hello-ok` در صورت موجود بودن، به‌همراه دسته‌بندی آشکارشدهٔ `capability`.

  </Accordion>
  <Accordion title="کدهای هشدار متداول">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به وارسی‌های مستقیم بازگشت.
    - `multiple_gateways`: هویت‌های متمایز Gateway قابل دسترسی بودند، یا OpenClaw نتوانست اثبات کند مقصدهای قابل دسترسی همان Gateway هستند. تونل SSH، نشانی پروکسی یا نشانی راه‌دور پیکربندی‌شده به همان Gateway این هشدار را فعال نمی‌کند.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای مقصدی ناموفق قابل حل نبود.
    - `probe_scope_limited`: اتصال WebSocket موفق بود، اما وارسی خواندن به‌دلیل نبود `operator.read` محدود شد.
    - `local_tls_runtime_unavailable`:‏ TLS محلی Gateway فعال است، اما OpenClaw نتوانست اثر انگشت گواهی محلی را بارگذاری کند.

  </Accordion>
</AccordionGroup>

#### راه‌دور از طریق SSH (هم‌ترازی با برنامهٔ Mac)

حالت "Remote over SSH" در برنامهٔ macOS از یک انتقال درگاه محلی استفاده می‌کند تا Gateway راه‌دوری که فقط روی loopback در دسترس است، در `ws://127.0.0.1:<port>` قابل دسترسی شود.

معادل CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` یا `user@host:port` (درگاه پیش‌فرض `22` است).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  فایل هویت.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  نخستین میزبان Gateway کشف‌شده را از نقطهٔ پایانی کشف حل‌شده (`local.` به‌علاوهٔ دامنهٔ گستردهٔ پیکربندی‌شده، در صورت وجود) به‌عنوان مقصد SSH انتخاب می‌کند. راهنماهای فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیش‌فرض‌های پیکربندی (اختیاری):‏ `gateway.remote.sshTarget`،‏ `gateway.remote.sshIdentity`.

### `gateway call <method>`

ابزار کمکی سطح‌پایین RPC.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"limit": 200}'
```

<ParamField path="--params <json>" type="string" default="{}">
  رشتهٔ شیء JSON برای پارامترها.
</ParamField>
<ParamField path="--url <url>" type="string">
  نشانی WebSocket مربوط به Gateway.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژهٔ Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  بودجهٔ مهلت زمانی.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  عمدتاً برای RPCهای سبک عامل که پیش از بار نهایی، رویدادهای میانی را به‌صورت جریانی ارسال می‌کنند.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی JSON قابل خواندن توسط ماشین.
</ParamField>

<Note>
`--params` باید JSON معتبر باشد و هر متد، شکل پارامترهای خود را اعتبارسنجی می‌کند (فیلدهای اضافی یا با نام نادرست رد می‌شوند).
</Note>

## مدیریت سرویس Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### نصب با یک پوشاننده

وقتی سرویس مدیریت‌شده باید از طریق یک فایل اجرایی دیگر آغاز شود، از `--wrapper` استفاده کنید؛ برای مثال یک واسط مدیر رازها یا ابزار کمکی اجرای برنامه با هویت کاربر دیگر. پوشاننده آرگومان‌های معمول Gateway را دریافت می‌کند و مسئول است در نهایت `openclaw` یا Node را با آن آرگومان‌ها اجرا کند.

```bash
cat > ~/.local/bin/openclaw-doppler <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
exec doppler run --project my-project --config production -- openclaw "$@"
EOF
chmod +x ~/.local/bin/openclaw-doppler

openclaw gateway install --wrapper ~/.local/bin/openclaw-doppler --force
openclaw gateway restart
```

همچنین می‌توانید پوشاننده را از طریق محیط تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل اجرایی است، پوشاننده را در `ProgramArguments` سرویس می‌نویسد و `OPENCLAW_WRAPPER` را در محیط سرویس برای نصب‌های مجدد اجباری، به‌روزرسانی‌ها و ترمیم‌های بعدی doctor ماندگار می‌کند.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

برای حذف پوشاننده ماندگارشده، هنگام نصب مجدد `OPENCLAW_WRAPPER` را پاک کنید:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="گزینه‌های فرمان">
    - `gateway status`: `--url`، `--token`، `--password`، `--timeout`، `--no-probe`، `--require-rpc`، `--deep`، `--json`
    - `gateway install`: `--port`، `--runtime <node|bun>` (پیش‌فرض: `node`)، `--token`، `--wrapper <path>`، `--force`، `--json`
    - `gateway restart`: `--safe`، `--skip-deferral`، `--force`، `--wait <duration>`، `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`، `--json`

  </Accordion>
  <Accordion title="رفتار چرخهٔ حیات">
    - برای راه‌اندازی مجدد یک سرویس مدیریت‌شده از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین راه‌اندازی مجدد به‌صورت زنجیره‌ای اجرا نکنید.
    - در macOS، `gateway stop` به‌طور پیش‌فرض از `launchctl bootout` استفاده می‌کند که LaunchAgent را بدون ماندگارکردن حالت غیرفعال از نشست راه‌اندازی فعلی حذف می‌کند؛ بازیابی خودکار KeepAlive برای خرابی‌های آینده فعال می‌ماند و `gateway start` بدون نیاز به اجرای دستی `launchctl enable` آن را به‌درستی دوباره فعال می‌کند. برای سرکوب ماندگار KeepAlive و RunAtLoad، گزینهٔ `--disable` را ارسال کنید تا Gateway تا اجرای صریح بعدی `gateway start` دوباره ایجاد نشود؛ زمانی از این گزینه استفاده کنید که توقف دستی باید پس از راه‌اندازی مجدد سیستم نیز حفظ شود.
    - فرمان‌های چرخهٔ حیات برای اسکریپت‌نویسی گزینهٔ `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefها هنگام نصب">
    - وقتی احراز هویت توکنی به توکن نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` اعتبارسنجی می‌کند که SecretRef قابل حل است، اما توکن حل‌شده را در فرادادهٔ محیط سرویس ماندگار نمی‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده حل‌نشده باشد، نصب به‌جای ماندگارکردن متن سادهٔ جایگزین، به‌صورت بسته شکست می‌خورد.
    - برای احراز هویت با گذرواژه در `gateway run`، به‌جای `--password` درون‌خطی، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file` یا `gateway.auth.password` مبتنی بر SecretRef را ترجیح دهید.
    - در حالت احراز هویت استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` که فقط در پوسته تنظیم شده است، الزامات توکن نصب را آسان‌تر نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی ماندگار (`gateway.auth.password` یا `env` در پیکربندی) استفاده کنید.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که حالت به‌صراحت تنظیم شود مسدود می‌ماند.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` اعلان‌های Gateway (`_openclaw-gw._tcp`) را جست‌وجو می‌کند.

- DNS-SD چندپخشی: `local.`
- DNS-SD تک‌پخشی (Bonjour گسترده): یک دامنه انتخاب کنید (برای نمونه: `openclaw.internal.`) و DNS تفکیک‌شده به‌همراه یک سرور DNS راه‌اندازی کنید؛ به [Bonjour](/fa/gateway/bonjour) مراجعه کنید.

فقط Gatewayهایی که کشف Bonjour در آن‌ها فعال است (پیش‌فرض)، اعلان را منتشر می‌کنند.

راهنمایی‌های TXT در هر اعلان: `role` (راهنمای نقش Gateway)، `transport` (راهنمای انتقال، برای نمونه `gateway`)، `gatewayPort` (درگاه WebSocket، معمولاً `18789`)، `tailnetDns` (نام میزبان MagicDNS، در صورت موجود بودن)، `gatewayTls` / `gatewayTlsSha256` (فعال‌بودن TLS و اثر انگشت گواهی). `sshPort` و `cliPath` فقط در حالت کشف کامل منتشر می‌شوند (`discovery.mdns.mode: "full"`؛ پیش‌فرض `"minimal"` است که آن‌ها را حذف می‌کند؛ در نتیجه کلاینت‌ها به‌طور پیش‌فرض از درگاه `22` برای مقصدهای SSH استفاده می‌کنند).

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلت زمانی هر فرمان (مرور/حل).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل‌خواندن برای ماشین (همچنین سبک‌دهی/نشانگر چرخان را غیرفعال می‌کند).
</ParamField>

نمونه‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- `local.` و در صورت فعال‌بودن، دامنهٔ گستردهٔ پیکربندی‌شده را جست‌وجو می‌کند.
- `wsUrl` در خروجی JSON از نقطهٔ پایانی سرویس حل‌شده به دست می‌آید، نه از راهنمایی‌های صرفاً TXT مانند `lanHost` یا `tailnetDns`.
- `discovery.mdns.mode` انتشار `sshPort`/`cliPath` را هم در mDNS مربوط به `local.` و هم در DNS-SD گسترده کنترل می‌کند (به بخش بالا مراجعه کنید).

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [راهنمای عملیاتی Gateway](/fa/gateway)
