---
read_when:
    - اجرای Gateway از طریق CLI (محیط توسعه یا سرورها)
    - عیب‌یابی احراز هویت Gateway، حالت‌های اتصال، و اتصال‌پذیری
    - کشف Gatewayها از طریق Bonjour (محلی + DNS-SD گسترده‌ناحیه)
sidebarTitle: Gateway
summary: OpenClaw Gateway CLI (`openclaw gateway`) — اجرای Gatewayها، پرس‌وجوی آن‌ها و کشف آن‌ها
title: Gateway
x-i18n:
    generated_at: "2026-05-11T20:29:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 774753c844909d1ec9257f2035b10c2561432ec2161351e9a6438cd12f7f2ecc
    source_path: cli/gateway.md
    workflow: 16
---

Gateway سرور WebSocket متعلق به OpenClaw است (کانال‌ها، نودها، نشست‌ها، هوک‌ها). زیر‌فرمان‌های این صفحه زیر `openclaw gateway …` قرار دارند.

<CardGroup cols={3}>
  <Card title="کشف Bonjour" href="/fa/gateway/bonjour">
    راه‌اندازی mDNS محلی + DNS-SD گسترده.
  </Card>
  <Card title="نمای کلی کشف" href="/fa/gateway/discovery">
    اینکه OpenClaw چگونه Gatewayها را اعلام و پیدا می‌کند.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration">
    کلیدهای پیکربندی سطح‌بالای Gateway.
  </Card>
</CardGroup>

## اجرای Gateway

یک فرایند Gateway محلی را اجرا کنید:

```bash
openclaw gateway
```

نام مستعار پیش‌زمینه:

```bash
openclaw gateway run
```

<AccordionGroup>
  <Accordion title="رفتار راه‌اندازی">
    - به‌طور پیش‌فرض، Gateway شروع به کار نمی‌کند مگر اینکه `gateway.mode=local` در `~/.openclaw/openclaw.json` تنظیم شده باشد. برای اجراهای موقت/توسعه‌ای از `--allow-unconfigured` استفاده کنید.
    - انتظار می‌رود `openclaw onboard --mode local` و `openclaw setup` مقدار `gateway.mode=local` را بنویسند. اگر فایل وجود دارد اما `gateway.mode` در آن نیست، این وضعیت را یک پیکربندی خراب یا بازنویسی‌شده تلقی کنید و به‌جای اینکه حالت محلی را ضمنی فرض کنید، آن را تعمیر کنید.
    - اگر فایل وجود دارد و `gateway.mode` در آن نیست، Gateway این را آسیب مشکوک به پیکربندی تلقی می‌کند و از «حدس‌زدن local» برای شما خودداری می‌کند.
    - اتصال فراتر از loopback بدون احراز هویت مسدود می‌شود (حفاظ ایمنی).
    - `SIGUSR1` وقتی مجاز باشد یک راه‌اندازی مجدد درون‌فرایندی را آغاز می‌کند (`commands.restart` به‌طور پیش‌فرض فعال است؛ برای مسدود کردن راه‌اندازی مجدد دستی، `commands.restart: false` را تنظیم کنید، در حالی که ابزار Gateway/اعمال پیکربندی/به‌روزرسانی همچنان مجاز می‌مانند).
    - هندلرهای `SIGINT`/`SIGTERM` فرایند Gateway را متوقف می‌کنند، اما هیچ وضعیت سفارشی ترمینال را بازنمی‌گردانند. اگر CLI را با یک TUI یا ورودی raw-mode بسته‌بندی می‌کنید، پیش از خروج ترمینال را بازگردانید.

  </Accordion>
</AccordionGroup>

### گزینه‌ها

<ParamField path="--port <port>" type="number">
  پورت WebSocket (پیش‌فرض از پیکربندی/محیط می‌آید؛ معمولاً `18789`).
</ParamField>
<ParamField path="--bind <loopback|lan|tailnet|auto|custom>" type="string">
  حالت اتصال شنونده.
</ParamField>
<ParamField path="--auth <token|password>" type="string">
  بازنویسی حالت احراز هویت.
</ParamField>
<ParamField path="--token <token>" type="string">
  بازنویسی توکن (همچنین `OPENCLAW_GATEWAY_TOKEN` را برای فرایند تنظیم می‌کند).
</ParamField>
<ParamField path="--password <password>" type="string">
  بازنویسی گذرواژه.
</ParamField>
<ParamField path="--password-file <path>" type="string">
  گذرواژه Gateway را از یک فایل بخوانید.
</ParamField>
<ParamField path="--tailscale <off|serve|funnel>" type="string">
  Gateway را از طریق Tailscale در دسترس قرار دهید.
</ParamField>
<ParamField path="--tailscale-reset-on-exit" type="boolean">
  هنگام خاموشی، پیکربندی serve/funnel مربوط به Tailscale را بازنشانی کنید.
</ParamField>
<ParamField path="--allow-unconfigured" type="boolean">
  اجازه دهید Gateway بدون `gateway.mode=local` در پیکربندی شروع شود. این فقط برای bootstrap موقت/توسعه‌ای از حفاظ راه‌اندازی عبور می‌کند؛ فایل پیکربندی را نمی‌نویسد یا تعمیر نمی‌کند.
</ParamField>
<ParamField path="--dev" type="boolean">
  اگر پیکربندی توسعه + فضای کاری وجود ندارد، آن را ایجاد کنید (`BOOTSTRAP.md` را رد می‌کند).
</ParamField>
<ParamField path="--reset" type="boolean">
  پیکربندی توسعه + اعتبارنامه‌ها + نشست‌ها + فضای کاری را بازنشانی کنید (به `--dev` نیاز دارد).
</ParamField>
<ParamField path="--force" type="boolean">
  پیش از شروع، هر شنونده موجود روی پورت انتخاب‌شده را متوقف کنید.
</ParamField>
<ParamField path="--verbose" type="boolean">
  گزارش‌های مفصل.
</ParamField>
<ParamField path="--cli-backend-logs" type="boolean">
  فقط گزارش‌های backend مربوط به CLI را در کنسول نشان دهید (و stdout/stderr را فعال کنید).
</ParamField>
<ParamField path="--ws-log <auto|full|compact>" type="string" default="auto">
  سبک گزارش WebSocket.
</ParamField>
<ParamField path="--compact" type="boolean">
  نام مستعار برای `--ws-log compact`.
</ParamField>
<ParamField path="--raw-stream" type="boolean">
  رویدادهای خام جریان مدل را در jsonl ثبت کنید.
</ParamField>
<ParamField path="--raw-stream-path <path>" type="string">
  مسیر jsonl برای جریان خام.
</ParamField>

## راه‌اندازی مجدد Gateway

```bash
openclaw gateway restart
openclaw gateway restart --safe
openclaw gateway restart --safe --skip-deferral
openclaw gateway restart --force
```

`openclaw gateway restart --safe` از Gateway در حال اجرا می‌خواهد پیش از راه‌اندازی مجدد، کارهای فعال OpenClaw را پیش‌بررسی کند. اگر عملیات صف‌شده، تحویل پاسخ، اجراهای embedded یا اجرای وظیفه‌ها فعال باشند، Gateway مسدودکننده‌ها را گزارش می‌کند، درخواست‌های تکراری راه‌اندازی مجدد ایمن را ادغام می‌کند، و پس از تخلیه کار فعال دوباره راه‌اندازی می‌شود. `restart` ساده، رفتار موجود مدیر سرویس را برای سازگاری حفظ می‌کند. فقط وقتی از `--force` استفاده کنید که صریحاً مسیر بازنویسی فوری را می‌خواهید.

`openclaw gateway restart --safe --skip-deferral` همان راه‌اندازی مجدد هماهنگ و آگاه از OpenClaw را مانند `--safe` اجرا می‌کند، اما از گیت تعویقِ کار فعال عبور می‌کند تا Gateway حتی وقتی مسدودکننده‌ها گزارش شده‌اند، راه‌اندازی مجدد را فوراً منتشر کند. وقتی تعویق به‌دلیل یک اجرای وظیفه گیرکرده ثابت مانده و `--safe` به‌تنهایی بی‌نهایت منتظر می‌ماند، از آن به‌عنوان راه خروج اپراتور استفاده کنید. `--skip-deferral` به `--safe` نیاز دارد.

<Warning>
`--password` درون‌خطی ممکن است در فهرست فرایندهای محلی افشا شود. `--password-file`، محیط، یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را ترجیح دهید.
</Warning>

### پروفایل‌گیری راه‌اندازی

- `OPENCLAW_GATEWAY_STARTUP_TRACE=1` را تنظیم کنید تا زمان‌بندی فازها هنگام راه‌اندازی Gateway ثبت شود، شامل تأخیر `eventLoopMax` در هر فاز و زمان‌بندی‌های جدول lookup مربوط به Plugin برای installed-index، رجیستری manifest، برنامه‌ریزی راه‌اندازی و کار owner-map.
- `OPENCLAW_DIAGNOSTICS=timeline` را همراه با `OPENCLAW_DIAGNOSTICS_TIMELINE_PATH=<path>` تنظیم کنید تا یک timeline تشخیصی راه‌اندازی JSONL با best-effort برای harnessهای QA خارجی نوشته شود. همچنین می‌توانید این پرچم را با `diagnostics.flags: ["timeline"]` در پیکربندی فعال کنید؛ مسیر همچنان از محیط ارائه می‌شود. برای افزودن نمونه‌های event-loop، `OPENCLAW_DIAGNOSTICS_EVENT_LOOP=1` را اضافه کنید.
- برای benchmark راه‌اندازی Gateway، `pnpm test:startup:gateway -- --runs 5 --warmup 1` را اجرا کنید. benchmark اولین خروجی فرایند، `/healthz`، `/readyz`، زمان‌بندی‌های startup trace، تأخیر event-loop، و جزئیات زمان‌بندی جدول lookup مربوط به Plugin را ثبت می‌کند.

## پرس‌وجو از یک Gateway در حال اجرا

همه فرمان‌های پرس‌وجو از RPC مبتنی بر WebSocket استفاده می‌کنند.

<Tabs>
  <Tab title="حالت‌های خروجی">
    - پیش‌فرض: خوانا برای انسان (رنگی در TTY).
    - `--json`: JSON خوانا برای ماشین (بدون استایل/چرخنده).
    - `--no-color` (یا `NO_COLOR=1`): ANSI را غیرفعال می‌کند و چیدمان انسانی را نگه می‌دارد.

  </Tab>
  <Tab title="گزینه‌های مشترک">
    - `--url <url>`: URL WebSocket مربوط به Gateway.
    - `--token <token>`: توکن Gateway.
    - `--password <password>`: گذرواژه Gateway.
    - `--timeout <ms>`: timeout/بودجه زمانی (بسته به فرمان متفاوت است).
    - `--expect-final`: منتظر یک پاسخ "final" بمانید (فراخوانی‌های عامل).

  </Tab>
</Tabs>

<Note>
وقتی `--url` را تنظیم می‌کنید، CLI به اعتبارنامه‌های پیکربندی یا محیط fallback نمی‌کند. `--token` یا `--password` را صریحاً ارسال کنید. نبود اعتبارنامه‌های صریح یک خطا است.
</Note>

### `gateway health`

```bash
openclaw gateway health --url ws://127.0.0.1:18789
```

نقطه پایانی HTTP `/healthz` یک liveness probe است: وقتی سرور بتواند به HTTP پاسخ دهد، برمی‌گردد. نقطه پایانی HTTP `/readyz` سخت‌گیرتر است و تا زمانی که sidecarهای Plugin راه‌اندازی، کانال‌ها، یا هوک‌های پیکربندی‌شده هنوز در حال پایدار شدن هستند، قرمز می‌ماند. پاسخ‌های آمادگی تفصیلی محلی یا احراز هویت‌شده شامل یک بلوک تشخیصی `eventLoop` با تأخیر event-loop، بهره‌برداری event-loop، نسبت هسته CPU، و یک پرچم `degraded` هستند.

### `gateway usage-cost`

خلاصه‌های هزینه مصرف را از گزارش‌های نشست دریافت کنید.

```bash
openclaw gateway usage-cost
openclaw gateway usage-cost --days 7
openclaw gateway usage-cost --json
```

<ParamField path="--days <days>" type="number" default="30">
  تعداد روزهایی که باید شامل شوند.
</ParamField>

### `gateway stability`

ضبط‌کننده پایداری تشخیصی اخیر را از یک Gateway در حال اجرا دریافت کنید.

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --bundle latest
openclaw gateway stability --bundle latest --export
openclaw gateway stability --json
```

<ParamField path="--limit <limit>" type="number" default="25">
  بیشینه تعداد رویدادهای اخیر برای درج (حداکثر `1000`).
</ParamField>
<ParamField path="--type <type>" type="string">
  بر اساس نوع رویداد تشخیصی فیلتر کنید، مانند `payload.large` یا `diagnostic.memory.pressure`.
</ParamField>
<ParamField path="--since-seq <seq>" type="number">
  فقط رویدادهای پس از یک شماره توالی تشخیصی را شامل کنید.
</ParamField>
<ParamField path="--bundle [path]" type="string">
  به‌جای فراخوانی Gateway در حال اجرا، یک بسته پایداری persisted را بخوانید. برای جدیدترین بسته زیر دایرکتوری state از `--bundle latest` (یا فقط `--bundle`) استفاده کنید، یا مسیر JSON یک بسته را مستقیماً ارسال کنید.
</ParamField>
<ParamField path="--export" type="boolean">
  به‌جای چاپ جزئیات پایداری، یک zip تشخیصی پشتیبانی قابل‌اشتراک بنویسید.
</ParamField>
<ParamField path="--output <path>" type="string">
  مسیر خروجی برای `--export`.
</ParamField>

<AccordionGroup>
  <Accordion title="حریم خصوصی و رفتار بسته">
    - رکوردها فراداده عملیاتی را نگه می‌دارند: نام رویدادها، شمارش‌ها، اندازه‌های بایتی، خوانش‌های حافظه، وضعیت صف/نشست، نام کانال/Plugin، و خلاصه‌های redact‌شده نشست. آن‌ها متن چت، بدنه‌های Webhook، خروجی ابزارها، بدنه خام درخواست یا پاسخ، توکن‌ها، کوکی‌ها، مقادیر محرمانه، نام میزبان‌ها، یا شناسه‌های خام نشست را نگه نمی‌دارند. برای غیرفعال کردن کامل ضبط‌کننده، `diagnostics.enabled: false` را تنظیم کنید.
    - هنگام خروج‌های fatal از Gateway، timeoutهای خاموشی، و شکست‌های راه‌اندازی پس از restart، وقتی ضبط‌کننده رویداد داشته باشد، OpenClaw همان snapshot تشخیصی را در `~/.openclaw/logs/stability/openclaw-stability-*.json` می‌نویسد. جدیدترین بسته را با `openclaw gateway stability --bundle latest` بررسی کنید؛ `--limit`، `--type`، و `--since-seq` نیز روی خروجی بسته اعمال می‌شوند.

  </Accordion>
</AccordionGroup>

### `gateway diagnostics export`

یک zip تشخیصی محلی بنویسید که برای پیوست به گزارش‌های باگ طراحی شده است. برای مدل حریم خصوصی و محتوای بسته، [Diagnostics Export](/fa/gateway/diagnostics) را ببینید.

```bash
openclaw gateway diagnostics export
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
openclaw gateway diagnostics export --json
```

<ParamField path="--output <path>" type="string">
  مسیر zip خروجی. به‌طور پیش‌فرض یک export پشتیبانی زیر دایرکتوری state است.
</ParamField>
<ParamField path="--log-lines <count>" type="number" default="5000">
  بیشینه خطوط گزارش پاک‌سازی‌شده برای درج.
</ParamField>
<ParamField path="--log-bytes <bytes>" type="number" default="1000000">
  بیشینه بایت‌های گزارش برای بررسی.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL WebSocket مربوط به Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway برای snapshot سلامت.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="3000">
  timeout مربوط به snapshot وضعیت/سلامت.
</ParamField>
<ParamField path="--no-stability-bundle" type="boolean">
  جست‌وجوی بسته پایداری persisted را رد کنید.
</ParamField>
<ParamField path="--json" type="boolean">
  مسیر نوشته‌شده، اندازه، و manifest را به‌صورت JSON چاپ کنید.
</ParamField>

این export شامل یک manifest، خلاصه Markdown، شکل پیکربندی، جزئیات پیکربندی پاک‌سازی‌شده، خلاصه‌های گزارش پاک‌سازی‌شده، snapshotهای وضعیت/سلامت پاک‌سازی‌شده Gateway، و جدیدترین بسته پایداری در صورت وجود است.

برای اشتراک‌گذاری در نظر گرفته شده است. جزئیات عملیاتی مفید برای اشکال‌زدایی را نگه می‌دارد، مانند فیلدهای گزارش ایمن OpenClaw، نام زیرسامانه‌ها، کدهای وضعیت، مدت‌زمان‌ها، حالت‌های پیکربندی‌شده، پورت‌ها، شناسه‌های Plugin، شناسه‌های provider، تنظیمات غیرمحرمانه قابلیت‌ها، و پیام‌های گزارش عملیاتی redact‌شده. متن چت، بدنه‌های Webhook، خروجی ابزارها، اعتبارنامه‌ها، کوکی‌ها، شناسه‌های حساب/پیام، متن prompt/instruction، نام میزبان‌ها، و مقادیر محرمانه را حذف یا redact می‌کند. وقتی یک پیام به سبک LogTape شبیه متن payload کاربر/چت/ابزار باشد، export فقط این را نگه می‌دارد که یک پیام حذف شده است به‌همراه تعداد بایت آن.

### `gateway status`

`gateway status` سرویس Gateway (launchd/systemd/schtasks) را به‌همراه یک probe اختیاری از قابلیت اتصال/احراز هویت نشان می‌دهد.

```bash
openclaw gateway status
openclaw gateway status --json
openclaw gateway status --require-rpc
```

<ParamField path="--url <url>" type="string">
  یک هدف صریح برای پروب اضافه کنید. remote پیکربندی‌شده + localhost همچنان پروب می‌شوند.
</ParamField>
<ParamField path="--token <token>" type="string">
  احراز هویت با توکن برای پروب.
</ParamField>
<ParamField path="--password <password>" type="string">
  احراز هویت با گذرواژه برای پروب.
</ParamField>
<ParamField path="--timeout <ms>" type="number" default="10000">
  مهلت زمانی پروب.
</ParamField>
<ParamField path="--no-probe" type="boolean">
  پروب اتصال را رد کنید (نمای فقط سرویس).
</ParamField>
<ParamField path="--deep" type="boolean">
  سرویس‌های سطح سیستم را نیز اسکن کنید.
</ParamField>
<ParamField path="--require-rpc" type="boolean">
  پروب اتصال پیش‌فرض را به یک پروب خواندن ارتقا دهید و وقتی آن پروب خواندن شکست می‌خورد، با مقدار غیرصفر خارج شوید. نمی‌تواند با `--no-probe` ترکیب شود.
</ParamField>

<AccordionGroup>
  <Accordion title="معناشناسی وضعیت">
    - `gateway status` حتی وقتی پیکربندی CLI محلی وجود ندارد یا نامعتبر است، برای عیب‌یابی در دسترس می‌ماند.
    - `gateway status` پیش‌فرض وضعیت سرویس، اتصال WebSocket، و قابلیت احراز هویت قابل مشاهده در زمان دست‌دهی را اثبات می‌کند. عملیات خواندن/نوشتن/مدیریت را اثبات نمی‌کند.
    - پروب‌های عیب‌یابی برای احراز هویت دستگاه در اجرای اول، بدون تغییر هستند: وقتی توکن دستگاه کش‌شده موجود باشد از همان استفاده می‌کنند، اما فقط برای بررسی وضعیت، هویت دستگاه CLI جدید یا رکورد جفت‌سازی دستگاه فقط‌خواندنی ایجاد نمی‌کنند.
    - `gateway status` در صورت امکان SecretRefهای احراز هویت پیکربندی‌شده را برای احراز هویت پروب حل می‌کند.
    - اگر یک SecretRef احراز هویت الزامی در این مسیر فرمان حل‌نشده باشد، وقتی اتصال/احراز هویت پروب شکست بخورد، `gateway status --json` مقدار `rpc.authWarning` را گزارش می‌کند؛ `--token`/`--password` را صریح ارسال کنید یا ابتدا منبع secret را حل کنید.
    - اگر پروب موفق شود، هشدارهای auth-ref حل‌نشده برای جلوگیری از مثبت کاذب سرکوب می‌شوند.
    - وقتی یک سرویس در حال گوش دادن کافی نیست و باید فراخوانی‌های RPC با دامنه خواندن نیز سالم باشند، از `--require-rpc` در اسکریپت‌ها و خودکارسازی استفاده کنید.
    - `--deep` یک اسکن best-effort برای نصب‌های اضافی launchd/systemd/schtasks اضافه می‌کند. وقتی چند سرویس شبیه Gateway تشخیص داده شوند، خروجی انسانی راهنمای پاک‌سازی چاپ می‌کند و هشدار می‌دهد که بیشتر راه‌اندازی‌ها باید برای هر ماشین یک Gateway اجرا کنند.
    - `--deep` همچنین وقتی فرایند سرویس برای راه‌اندازی مجدد توسط supervisor خارجی با موفقیت خارج شده باشد، واگذاری اخیر راه‌اندازی مجدد supervisor Gateway را گزارش می‌کند.
    - `--deep` اعتبارسنجی پیکربندی را در حالت آگاه از Plugin اجرا می‌کند (`pluginValidation: "full"`) و هشدارهای manifest Plugin پیکربندی‌شده را نمایان می‌کند (برای مثال نبود metadata پیکربندی کانال) تا بررسی‌های دود نصب و به‌روزرسانی آن‌ها را بگیرند. `gateway status` پیش‌فرض مسیر فقط‌خواندنی سریع را نگه می‌دارد که اعتبارسنجی Plugin را رد می‌کند.
    - خروجی انسانی شامل مسیر فایل log حل‌شده به‌همراه snapshot مسیرها/اعتبار پیکربندی CLI در برابر سرویس است تا به تشخیص drift پروفایل یا state-dir کمک کند.

  </Accordion>
  <Accordion title="بررسی‌های drift احراز هویت Linux systemd">
    - در نصب‌های Linux systemd، بررسی‌های drift احراز هویت سرویس هم مقدارهای `Environment=` و هم `EnvironmentFile=` را از unit می‌خوانند (از جمله `%h`، مسیرهای quoted، چند فایل، و فایل‌های اختیاری `-`).
    - بررسی‌های drift، SecretRefهای `gateway.auth.token` را با استفاده از env زمان اجرا ادغام‌شده حل می‌کنند (ابتدا env فرمان سرویس، سپس fallback به env فرایند).
    - اگر احراز هویت توکنی عملا فعال نباشد (`gateway.auth.mode` صریح با مقدار `password`/`none`/`trusted-proxy`، یا mode تنظیم نشده باشد جایی که گذرواژه می‌تواند برنده شود و هیچ نامزد توکنی نمی‌تواند برنده شود)، بررسی‌های token-drift حل توکن پیکربندی را رد می‌کنند.

  </Accordion>
</AccordionGroup>

### `gateway probe`

`gateway probe` فرمان «debug everything» است. همیشه این‌ها را پروب می‌کند:

- Gateway دوردست پیکربندی‌شده شما (اگر تنظیم شده باشد)، و
- localhost (loopback) **حتی اگر remote پیکربندی شده باشد**.

اگر `--url` را ارسال کنید، آن هدف صریح قبل از هر دو اضافه می‌شود. خروجی انسانی هدف‌ها را این‌گونه برچسب‌گذاری می‌کند:

- `URL (explicit)`
- `Remote (configured)` یا `Remote (configured, inactive)`
- `Local loopback`

<Note>
اگر چند Gateway قابل دسترسی باشند، همه آن‌ها را چاپ می‌کند. وقتی از پروفایل‌ها/پورت‌های جداشده استفاده می‌کنید (مثلا یک بات نجات)، چند Gateway پشتیبانی می‌شود، اما بیشتر نصب‌ها همچنان یک Gateway واحد اجرا می‌کنند.
</Note>

```bash
openclaw gateway probe
openclaw gateway probe --json
```

<AccordionGroup>
  <Accordion title="تفسیر">
    - `Reachable: yes` یعنی حداقل یک هدف اتصال WebSocket را پذیرفته است.
    - `Capability: read-only|write-capable|admin-capable|pairing-pending|connect-only` گزارش می‌کند پروب چه چیزی را درباره احراز هویت توانسته اثبات کند. این مورد از دسترس‌پذیری جدا است.
    - `Read probe: ok` یعنی فراخوانی‌های RPC جزئیات با دامنه خواندن (`health`/`status`/`system-presence`/`config.get`) نیز موفق شده‌اند.
    - `Read probe: limited - missing scope: operator.read` یعنی اتصال موفق شده اما RPC با دامنه خواندن محدود است. این مورد به‌عنوان دسترس‌پذیری **تنزل‌یافته** گزارش می‌شود، نه شکست کامل.
    - `Read probe: failed` پس از `Connect: ok` یعنی Gateway اتصال WebSocket را پذیرفته، اما عیب‌یابی خواندن بعدی timeout شده یا شکست خورده است. این نیز دسترس‌پذیری **تنزل‌یافته** است، نه Gateway غیرقابل دسترس.
    - مانند `gateway status`، probe از احراز هویت دستگاه کش‌شده موجود استفاده می‌کند اما هویت دستگاه یا وضعیت جفت‌سازی اجرای اول را ایجاد نمی‌کند.
    - کد خروجی فقط وقتی غیرصفر است که هیچ هدف پروب‌شده‌ای قابل دسترسی نباشد.

  </Accordion>
  <Accordion title="خروجی JSON">
    سطح بالا:

    - `ok`: حداقل یک هدف قابل دسترسی است.
    - `degraded`: حداقل یک هدف اتصال را پذیرفته اما عیب‌یابی کامل RPC جزئیات را کامل نکرده است.
    - `capability`: بهترین قابلیت دیده‌شده در میان هدف‌های قابل دسترسی (`read_only`، `write_capable`، `admin_capable`، `pairing_pending`، `connected_no_operator_scope`، یا `unknown`).
    - `primaryTargetId`: بهترین هدف برای تلقی به‌عنوان برنده فعال به این ترتیب: URL صریح، تونل SSH، remote پیکربندی‌شده، سپس local loopback.
    - `warnings[]`: رکوردهای هشدار best-effort با `code`، `message`، و `targetIds` اختیاری.
    - `network`: راهنمایی‌های URL مربوط به local loopback/tailnet که از پیکربندی فعلی و شبکه میزبان مشتق شده‌اند.
    - `discovery.timeoutMs` و `discovery.count`: بودجه/تعداد نتیجه واقعی discovery که برای این گذر پروب استفاده شده است.

    برای هر هدف (`targets[].connect`):

    - `ok`: دسترس‌پذیری پس از اتصال + دسته‌بندی تنزل‌یافته.
    - `rpcOk`: موفقیت کامل RPC جزئیات.
    - `scopeLimited`: RPC جزئیات به دلیل نبود دامنه operator شکست خورد.

    برای هر هدف (`targets[].auth`):

    - `role`: نقش احراز هویت گزارش‌شده در `hello-ok` وقتی در دسترس باشد.
    - `scopes`: دامنه‌های اعطاشده گزارش‌شده در `hello-ok` وقتی در دسترس باشند.
    - `capability`: دسته‌بندی قابلیت احراز هویت نمایان‌شده برای آن هدف.

  </Accordion>
  <Accordion title="کدهای هشدار رایج">
    - `ssh_tunnel_failed`: راه‌اندازی تونل SSH شکست خورد؛ فرمان به پروب‌های مستقیم fallback کرد.
    - `multiple_gateways`: بیش از یک هدف قابل دسترسی بود؛ این غیرمعمول است مگر اینکه عمدا پروفایل‌های جداشده اجرا کنید، مانند یک بات نجات.
    - `auth_secretref_unresolved`: یک SecretRef احراز هویت پیکربندی‌شده برای هدف شکست‌خورده حل نشد.
    - `probe_scope_limited`: اتصال WebSocket موفق شد، اما پروب خواندن به دلیل نبود `operator.read` محدود شد.

  </Accordion>
</AccordionGroup>

#### Remote از طریق SSH (هم‌ارزی با برنامه Mac)

حالت "Remote over SSH" در برنامه macOS از یک port-forward محلی استفاده می‌کند تا Gateway دوردست (که ممکن است فقط به loopback bind شده باشد) در `ws://127.0.0.1:<port>` قابل دسترسی شود.

معادل CLI:

```bash
openclaw gateway probe --ssh user@gateway-host
```

<ParamField path="--ssh <target>" type="string">
  `user@host` یا `user@host:port` (پورت به‌طور پیش‌فرض `22` است).
</ParamField>
<ParamField path="--ssh-identity <path>" type="string">
  فایل identity.
</ParamField>
<ParamField path="--ssh-auto" type="boolean">
  نخستین میزبان Gateway کشف‌شده را به‌عنوان هدف SSH از endpoint کشف حل‌شده انتخاب کنید (`local.` به‌علاوه دامنه wide-area پیکربندی‌شده، اگر وجود داشته باشد). راهنمایی‌های فقط TXT نادیده گرفته می‌شوند.
</ParamField>

پیکربندی (اختیاری، استفاده‌شده به‌عنوان پیش‌فرض):

- `gateway.remote.sshTarget`
- `gateway.remote.sshIdentity`

### `gateway call <method>`

کمک‌کننده RPC سطح پایین.

```bash
openclaw gateway call status
openclaw gateway call logs.tail --params '{"sinceMs": 60000}'
```

<ParamField path="--params <json>" type="string" default="{}">
  رشته شیء JSON برای params.
</ParamField>
<ParamField path="--url <url>" type="string">
  URL مربوط به Gateway WebSocket.
</ParamField>
<ParamField path="--token <token>" type="string">
  توکن Gateway.
</ParamField>
<ParamField path="--password <password>" type="string">
  گذرواژه Gateway.
</ParamField>
<ParamField path="--timeout <ms>" type="number">
  بودجه timeout.
</ParamField>
<ParamField path="--expect-final" type="boolean">
  عمدتا برای RPCهای سبک agent که پیش از payload نهایی رویدادهای میانی stream می‌کنند.
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی JSON قابل خواندن برای ماشین.
</ParamField>

<Note>
`--params` باید JSON معتبر باشد.
</Note>

## مدیریت سرویس Gateway

```bash
openclaw gateway install
openclaw gateway start
openclaw gateway stop
openclaw gateway restart
openclaw gateway uninstall
```

### نصب با wrapper

وقتی سرویس مدیریت‌شده باید از طریق یک executable دیگر شروع شود، مثلا یک shim مدیر secrets یا یک کمک‌کننده run-as، از `--wrapper` استفاده کنید. wrapper آرگومان‌های عادی Gateway را دریافت می‌کند و مسئول است که در نهایت `openclaw` یا Node را با همان آرگومان‌ها exec کند.

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

همچنین می‌توانید wrapper را از طریق محیط تنظیم کنید. `gateway install` اعتبارسنجی می‌کند که مسیر یک فایل executable است، wrapper را در `ProgramArguments` سرویس می‌نویسد، و `OPENCLAW_WRAPPER` را برای نصب مجدد اجباری، به‌روزرسانی‌ها، و تعمیرات doctor بعدی در محیط سرویس پایدار می‌کند.

```bash
OPENCLAW_WRAPPER="$HOME/.local/bin/openclaw-doppler" openclaw gateway install --force
openclaw doctor
```

برای حذف wrapper پایدارشده، هنگام نصب مجدد `OPENCLAW_WRAPPER` را پاک کنید:

```bash
OPENCLAW_WRAPPER= openclaw gateway install --force
openclaw gateway restart
```

<AccordionGroup>
  <Accordion title="گزینه‌های فرمان">
    - `gateway status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--require-rpc`, `--deep`, `--json`
    - `gateway install`: `--port`, `--runtime <node|bun>`, `--token`, `--wrapper <path>`, `--force`, `--json`
    - `gateway restart`: `--safe`, `--skip-deferral`, `--force`, `--wait <duration>`, `--json`
    - `gateway uninstall|start`: `--json`
    - `gateway stop`: `--disable`, `--json`

  </Accordion>
  <Accordion title="رفتار چرخه حیات">
    - برای راه‌اندازی دوباره یک سرویس مدیریت‌شده، از `gateway restart` استفاده کنید. `gateway stop` و `gateway start` را به‌عنوان جایگزین راه‌اندازی دوباره به‌صورت زنجیره‌ای اجرا نکنید.
    - در macOS، `gateway stop` به‌طور پیش‌فرض از `launchctl bootout` استفاده می‌کند، که LaunchAgent را از نشست بوت فعلی حذف می‌کند بدون اینکه غیرفعال‌سازی را ماندگار کند — بازیابی خودکار KeepAlive برای خرابی‌های آینده فعال می‌ماند و `gateway start` بدون نیاز به `launchctl enable` دستی، دوباره به‌شکل تمیز فعال می‌شود. برای سرکوب دائمی KeepAlive و RunAtLoad، گزینه `--disable` را بدهید تا Gateway تا زمان اجرای صریح بعدی `gateway start` دوباره اجرا نشود؛ وقتی توقف دستی باید پس از راه‌اندازی‌های دوباره یا ری‌استارت‌های سیستم هم باقی بماند، از این گزینه استفاده کنید.
    - `gateway restart --safe` از Gateway در حال اجرا می‌خواهد کار فعال OpenClaw را پیش‌بررسی کند و راه‌اندازی دوباره را تا خالی شدن تحویل پاسخ، اجراهای جاسازی‌شده و اجراهای تسک به تعویق بیندازد. `--safe` را نمی‌توان با `--force` یا `--wait` ترکیب کرد.
    - `gateway restart --wait 30s` بودجه تخلیه راه‌اندازی دوباره پیکربندی‌شده را برای همان راه‌اندازی دوباره بازنویسی می‌کند. عددهای بدون واحد برحسب میلی‌ثانیه هستند؛ واحدهایی مثل `s`، `m` و `h` پذیرفته می‌شوند. `--wait 0` به‌صورت نامحدود منتظر می‌ماند.
    - `gateway restart --safe --skip-deferral` راه‌اندازی دوباره امن و آگاه از OpenClaw را اجرا می‌کند، اما دروازه تعویق را دور می‌زند تا Gateway حتی هنگام گزارش شدن مسدودکننده‌ها، فوراً راه‌اندازی دوباره را منتشر کند. این مسیر فرار اپراتور برای تعویق‌های گیرکرده اجرای تسک است؛ به `--safe` نیاز دارد.
    - `gateway restart --force` تخلیه کار فعال را رد می‌کند و فوراً راه‌اندازی دوباره انجام می‌دهد. وقتی اپراتور مسدودکننده‌های تسک فهرست‌شده را از قبل بررسی کرده و می‌خواهد Gateway همین حالا برگردد، از آن استفاده کنید.
    - فرمان‌های چرخه حیات برای اسکریپت‌نویسی `--json` را می‌پذیرند.

  </Accordion>
  <Accordion title="احراز هویت و SecretRefs هنگام نصب">
    - وقتی احراز هویت توکنی به توکن نیاز دارد و `gateway.auth.token` با SecretRef مدیریت می‌شود، `gateway install` بررسی می‌کند که SecretRef قابل رفع باشد، اما توکن رفع‌شده را در فراداده محیط سرویس ماندگار نمی‌کند.
    - اگر احراز هویت توکنی به توکن نیاز داشته باشد و SecretRef توکن پیکربندی‌شده رفع‌نشده باشد، نصب به‌صورت بسته شکست می‌خورد و متن ساده جایگزین را ماندگار نمی‌کند.
    - برای احراز هویت گذرواژه‌ای در `gateway run`، `OPENCLAW_GATEWAY_PASSWORD`، `--password-file` یا `gateway.auth.password` پشتیبانی‌شده با SecretRef را به `--password` درون‌خطی ترجیح دهید.
    - در حالت احراز هویت استنباط‌شده، `OPENCLAW_GATEWAY_PASSWORD` که فقط در شل تنظیم شده باشد الزامات توکن نصب را سبک‌تر نمی‌کند؛ هنگام نصب یک سرویس مدیریت‌شده از پیکربندی بادوام (`gateway.auth.password` یا `env` پیکربندی) استفاده کنید.
    - اگر هر دو `gateway.auth.token` و `gateway.auth.password` پیکربندی شده باشند و `gateway.auth.mode` تنظیم نشده باشد، نصب تا زمانی که حالت به‌صراحت تنظیم شود مسدود می‌شود.

  </Accordion>
</AccordionGroup>

## کشف Gatewayها (Bonjour)

`gateway discover` برای beaconهای Gateway (`_openclaw-gw._tcp`) پویش می‌کند.

- Multicast DNS-SD: `local.`
- Unicast DNS-SD (Wide-Area Bonjour): یک دامنه انتخاب کنید (مثال: `openclaw.internal.`) و split DNS + یک سرور DNS راه‌اندازی کنید؛ [Bonjour](/fa/gateway/bonjour) را ببینید.

فقط Gatewayهایی که کشف Bonjour در آن‌ها فعال است (پیش‌فرض)، beacon را تبلیغ می‌کنند.

رکوردهای کشف گسترده شامل این موارد هستند (TXT):

- `role` (راهنمای نقش Gateway)
- `transport` (راهنمای انتقال، مثل `gateway`)
- `gatewayPort` (پورت WebSocket، معمولاً `18789`)
- `sshPort` (اختیاری؛ وقتی وجود نداشته باشد، کلاینت‌ها اهداف پیش‌فرض SSH را `22` در نظر می‌گیرند)
- `tailnetDns` (نام میزبان MagicDNS، در صورت وجود)
- `gatewayTls` / `gatewayTlsSha256` (TLS فعال + اثرانگشت گواهی)
- `cliPath` (راهنمای نصب از راه دور که در ناحیه گسترده نوشته می‌شود)

### `gateway discover`

```bash
openclaw gateway discover
```

<ParamField path="--timeout <ms>" type="number" default="2000">
  مهلت زمانی هر فرمان (مرور/رفع).
</ParamField>
<ParamField path="--json" type="boolean">
  خروجی قابل خواندن توسط ماشین (همچنین سبک‌دهی/چرخنده را غیرفعال می‌کند).
</ParamField>

نمونه‌ها:

```bash
openclaw gateway discover --timeout 4000
openclaw gateway discover --json | jq '.beacons[].wsUrl'
```

<Note>
- CLI، `local.` را به‌همراه دامنه گسترده پیکربندی‌شده، وقتی فعال باشد، پویش می‌کند.
- `wsUrl` در خروجی JSON از نقطه پایانی سرویس رفع‌شده مشتق می‌شود، نه از راهنماهای فقط-TXT مثل `lanHost` یا `tailnetDns`.
- در mDNS مربوط به `local.`، `sshPort` و `cliPath` فقط وقتی پخش می‌شوند که `discovery.mdns.mode` برابر `full` باشد. DNS-SD گسترده همچنان `cliPath` را می‌نویسد؛ `sshPort` آنجا هم اختیاری می‌ماند.

</Note>

## مرتبط

- [مرجع CLI](/fa/cli)
- [دفترچه عملیات Gateway](/fa/gateway)
